// Package sync provides logic for synchronizing match state from ESPN into Supabase.
package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"quiniela-backend/internal/espn"
)

// Options carries per-request parameters for a sync run.
type Options struct {
	// Source identifies what triggered the sync ("scheduler", "manual_ui", "manual_token", "unknown").
	Source string
}

// Result summarizes the outcome of a sync run.
type Result struct {
	Source                string     `json:"source"`
	TotalReviewed         int        `json:"total_reviewed"`
	TotalUpdated          int        `json:"total_updated"`
	TotalUnchanged        int        `json:"total_unchanged"`
	TotalOmitted          int        `json:"total_omitted"`
	DurationMs            int64      `json:"duration_ms"`
	Changes               []Change   `json:"changes"`
	Omissions             []Omission `json:"omissions,omitempty"`
	HasFinishedTransition bool       `json:"has_finished_transition"`
	KnockoutSynced        bool       `json:"knockout_synced,omitempty"`
	KnockoutSyncWarning   string     `json:"knockout_sync_warning,omitempty"`
}

// Change describes a single match that was updated (or would be in dry-run).
type Change struct {
	MatchID     string     `json:"match_id"`
	ESPNEventID string     `json:"espn_event_id"`
	Before      MatchState `json:"before"`
	After       MatchState `json:"after"`
}

// Omission describes a match that was skipped and why.
type Omission struct {
	MatchID     string `json:"match_id"`
	ESPNEventID string `json:"espn_event_id"`
	Reason      string `json:"reason"`
}

// MatchState is a snapshot of the mutable sync fields.
type MatchState struct {
	Status              string `json:"status"`
	HomeScore           *int   `json:"home_score"`
	AwayScore           *int   `json:"away_score"`
	PenaltyHomeScore    *int   `json:"penalty_home_score,omitempty"`
	PenaltyAwayScore    *int   `json:"penalty_away_score,omitempty"`
	RegulationHomeScore *int   `json:"regulation_home_score,omitempty"`
	RegulationAwayScore *int   `json:"regulation_away_score,omitempty"`
	KnockoutResolution  string `json:"knockout_resolution,omitempty"`
}

// dbMatch is a row from Supabase with only the fields relevant to sync.
type dbMatch struct {
	ID                  string `json:"id"`
	ESPNEventID         string `json:"espn_event_id"`
	KickoffAt           string `json:"kickoff_at"`
	Stage               string `json:"stage"`
	Status              string `json:"status"`
	HomeScore           *int   `json:"official_home_score"`
	AwayScore           *int   `json:"official_away_score"`
	PenaltyHomeScore    *int   `json:"penalty_home_score"`
	PenaltyAwayScore    *int   `json:"penalty_away_score"`
	RegulationHomeScore *int   `json:"regulation_home_score"`
	RegulationAwayScore *int   `json:"regulation_away_score"`
	KnockoutResolution  string `json:"knockout_resolution"`
}

// patchPayload is what we send to Supabase REST to update a match.
type patchPayload struct {
	Status              string `json:"status"`
	HomeScore           *int   `json:"official_home_score"`
	AwayScore           *int   `json:"official_away_score"`
	PenaltyHomeScore    *int   `json:"penalty_home_score,omitempty"`
	PenaltyAwayScore    *int   `json:"penalty_away_score,omitempty"`
	RegulationHomeScore *int   `json:"regulation_home_score,omitempty"`
	RegulationAwayScore *int   `json:"regulation_away_score,omitempty"`
	KnockoutResolution  string `json:"knockout_resolution,omitempty"`
}

// ESPNMatches fetches ESPN scoreboard data for all matches that have an
// espn_event_id, computes the state diff, and applies updates to Supabase.
//
// Matches without espn_event_id are silently ignored.
// Already-finished matches in the DB are never reverted.
// A finished transition is only written if ESPN supplies both valid scores.
func ESPNMatches(ctx context.Context, espnClient *espn.Client, supabaseURL, supabaseKey string, opts Options) (*Result, error) {
	start := time.Now()

	rows, err := fetchSyncableMatches(ctx, supabaseURL, supabaseKey)
	if err != nil {
		return nil, fmt.Errorf("fetching matches from Supabase: %w", err)
	}

	// Collect dates to fetch (UTC date + previous day to cover Americas timezone offset).
	dateSet := map[string]struct{}{}
	for _, m := range rows {
		t, err := parseTime(m.KickoffAt)
		if err != nil {
			continue
		}
		dateSet[t.UTC().Format("20060102")] = struct{}{}
		dateSet[t.UTC().AddDate(0, 0, -1).Format("20060102")] = struct{}{}
	}

	// Fetch ESPN scoreboards.
	eventByID := map[string]espn.Event{}
	for date := range dateSet {
		events, err := espnClient.GetScoreboard(ctx, date)
		if err != nil {
			// Non-fatal: we continue with whatever we have.
			continue
		}
		for _, ev := range events {
			eventByID[ev.ID] = ev
		}
	}

	result := &Result{}

	for _, m := range rows {
		result.TotalReviewed++

		ev, found := eventByID[m.ESPNEventID]
		if !found {
			reason := "espn event not found in scoreboard"
			log.Printf("sync omit match_id=%s espn_event_id=%s db_status=%s reason=%q", m.ID, m.ESPNEventID, m.Status, reason)
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      reason,
			})
			continue
		}

		log.Printf("sync eval match_id=%s espn_event_id=%s db_status=%s espn_status=%s espn_score=%s-%s",
			m.ID, m.ESPNEventID, m.Status, ev.StatusName(), ev.HomeScore(), ev.AwayScore())

		ns := computeNewState(m, ev)
		if ns.OmitReason != "" {
			log.Printf("sync omit match_id=%s espn_event_id=%s reason=%q", m.ID, m.ESPNEventID, ns.OmitReason)
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      ns.OmitReason,
			})
			continue
		}

		// For knockout matches transitioning to finished, enrich with regulation
		// scores and resolution method via ESPN summary (linescores).
		if ns.Status == "finished" && m.Stage != "group_stage" {
			if summary, err := espnClient.GetEventSummary(ctx, m.ESPNEventID); err == nil {
				enrichKnockoutResolution(summary, ev.StatusName(), &ns)
			} else {
				log.Printf("sync warn match_id=%s espn_event_id=%s summary fetch failed: %v", m.ID, m.ESPNEventID, err)
			}
		}

		if !stateChanged(m, ns) {
			result.TotalUnchanged++
			continue
		}

		before := MatchState{
			Status:              m.Status,
			HomeScore:           m.HomeScore,
			AwayScore:           m.AwayScore,
			PenaltyHomeScore:    m.PenaltyHomeScore,
			PenaltyAwayScore:    m.PenaltyAwayScore,
			RegulationHomeScore: m.RegulationHomeScore,
			RegulationAwayScore: m.RegulationAwayScore,
			KnockoutResolution:  m.KnockoutResolution,
		}
		after := MatchState{
			Status:              ns.Status,
			HomeScore:           ns.HomeScore,
			AwayScore:           ns.AwayScore,
			PenaltyHomeScore:    ns.PenaltyHomeScore,
			PenaltyAwayScore:    ns.PenaltyAwayScore,
			RegulationHomeScore: ns.RegulationHomeScore,
			RegulationAwayScore: ns.RegulationAwayScore,
			KnockoutResolution:  ns.KnockoutResolution,
		}

		log.Printf("sync patch match_id=%s espn_event_id=%s status=%s->%s score=%v/%v->%v/%v resolution=%q",
			m.ID, m.ESPNEventID, m.Status, ns.Status,
			m.HomeScore, m.AwayScore, ns.HomeScore, ns.AwayScore,
			ns.KnockoutResolution)

		if err := patchMatch(ctx, supabaseURL, supabaseKey, m.ID, patchPayload{
			Status:              ns.Status,
			HomeScore:           ns.HomeScore,
			AwayScore:           ns.AwayScore,
			PenaltyHomeScore:    ns.PenaltyHomeScore,
			PenaltyAwayScore:    ns.PenaltyAwayScore,
			RegulationHomeScore: ns.RegulationHomeScore,
			RegulationAwayScore: ns.RegulationAwayScore,
			KnockoutResolution:  ns.KnockoutResolution,
		}); err != nil {
			log.Printf("sync patch_error match_id=%s espn_event_id=%s err=%v", m.ID, m.ESPNEventID, err)
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      fmt.Sprintf("patch failed: %v", err),
			})
			continue
		}

		log.Printf("sync patched match_id=%s espn_event_id=%s ok", m.ID, m.ESPNEventID)
		result.TotalUpdated++
		result.Changes = append(result.Changes, Change{
			MatchID:     m.ID,
			ESPNEventID: m.ESPNEventID,
			Before:      before,
			After:       after,
		})
		if ns.Status == "finished" {
			result.HasFinishedTransition = true
		}
	}

	result.Source = opts.Source
	result.DurationMs = time.Since(start).Milliseconds()

	return result, nil
}

// newState is the computed target state for a match, returned by computeNewState.
type newState struct {
	Status              string
	HomeScore           *int
	AwayScore           *int
	PenaltyHomeScore    *int
	PenaltyAwayScore    *int
	RegulationHomeScore *int
	RegulationAwayScore *int
	KnockoutResolution  string // "regulation", "extra_time", or "penalties"
	OmitReason          string
}

// computeNewState maps an ESPN event to the target DB state for a match.
// Returns a newState with OmitReason non-empty if the match should be skipped.
func computeNewState(m dbMatch, ev espn.Event) newState {
	// Never revert a match that is already finished in the DB.
	if m.Status == "finished" {
		return newState{OmitReason: "already finished in DB — not reverting"}
	}

	espnStatus := ev.StatusName()
	mapped, ok := mapESPNStatus(espnStatus)
	if !ok {
		return newState{OmitReason: fmt.Sprintf("unknown ESPN status %q", espnStatus)}
	}

	switch mapped {
	case "scheduled":
		return newState{Status: "scheduled"}

	case "live":
		home, homeOK := parseScore(ev.HomeScore())
		away, awayOK := parseScore(ev.AwayScore())
		var hp, ap *int
		if homeOK {
			hp = &home
		}
		if awayOK {
			ap = &away
		}
		return newState{Status: "live", HomeScore: hp, AwayScore: ap}

	case "finished":
		home, homeOK := parseScore(ev.HomeScore())
		away, awayOK := parseScore(ev.AwayScore())
		if !homeOK || !awayOK {
			return newState{OmitReason: fmt.Sprintf("ESPN status is finished but scores not available (home=%q away=%q)", ev.HomeScore(), ev.AwayScore())}
		}
		// STATUS_FULL_TIME on a knockout match with a tied score means the 90 minutes
		// just ended and extra time is imminent. Treating it as "finished" here would
		// lock the match permanently via the "already finished" guard.
		// Map to "live" instead and wait for STATUS_EXTRA_TIME / STATUS_FINAL_AET.
		if espnStatus == "STATUS_FULL_TIME" && m.Stage != "group_stage" && home == away {
			return newState{Status: "live", HomeScore: &home, AwayScore: &away}
		}
		ns := newState{Status: "finished", HomeScore: &home, AwayScore: &away}
		if espnStatus == "STATUS_FINAL_PEN" {
			ph, phOK := parseScore(ev.HomePenaltyScore())
			pa, paOK := parseScore(ev.AwayPenaltyScore())
			if phOK && paOK {
				ns.PenaltyHomeScore = &ph
				ns.PenaltyAwayScore = &pa
			}
		}
		return ns
	}

	return newState{OmitReason: fmt.Sprintf("unhandled status %q", mapped)}
}

// mapESPNStatus converts an ESPN status name to our DB enum.
// Returns (status, true) on success, ("", false) for unknown/unsupported statuses.
func mapESPNStatus(name string) (string, bool) {
	switch name {
	case "STATUS_SCHEDULED":
		return "scheduled", true
	case "STATUS_IN_PROGRESS",
		"STATUS_FIRST_HALF",
		"STATUS_SECOND_HALF",
		"STATUS_HALFTIME",
		"STATUS_END_PERIOD",
		"STATUS_EXTRA_TIME",
		"STATUS_SHOOTOUT":
		return "live", true
	case "STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FINAL_AET", "STATUS_FINAL_PEN":
		return "finished", true
	default:
		return "", false
	}
}

// stateChanged returns true if any sync field differs from the DB row.
func stateChanged(m dbMatch, ns newState) bool {
	return m.Status != ns.Status ||
		!intPtrEqual(m.HomeScore, ns.HomeScore) ||
		!intPtrEqual(m.AwayScore, ns.AwayScore) ||
		!intPtrEqual(m.PenaltyHomeScore, ns.PenaltyHomeScore) ||
		!intPtrEqual(m.PenaltyAwayScore, ns.PenaltyAwayScore) ||
		!intPtrEqual(m.RegulationHomeScore, ns.RegulationHomeScore) ||
		!intPtrEqual(m.RegulationAwayScore, ns.RegulationAwayScore) ||
		m.KnockoutResolution != ns.KnockoutResolution
}

func intPtrEqual(a, b *int) bool {
	if a == nil && b == nil {
		return true
	}
	if a == nil || b == nil {
		return false
	}
	return *a == *b
}

// fetchSyncableMatches returns matches that have a non-null espn_event_id.
func fetchSyncableMatches(ctx context.Context, supabaseURL, key string) ([]dbMatch, error) {
	url := supabaseURL + "/rest/v1/matches" +
		"?select=id,espn_event_id,kickoff_at,stage,status,official_home_score,official_away_score,penalty_home_score,penalty_away_score,regulation_home_score,regulation_away_score,knockout_resolution" +
		"&espn_event_id=not.is.null" +
		"&order=kickoff_at.asc"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Supabase returned HTTP %d: %s", resp.StatusCode, body)
	}

	var rows []dbMatch
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}
	return rows, nil
}

// patchMatch applies a status/score update to a single match.
func patchMatch(ctx context.Context, supabaseURL, key, matchID string, payload patchPayload) error {
	url := supabaseURL + "/rest/v1/matches?id=eq." + matchID

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("PATCH %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, b)
	}
	return nil
}

// parseScore converts an ESPN score string to an int. Returns (0, false) if invalid.
func parseScore(s string) (int, bool) {
	if s == "" {
		return 0, false
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return 0, false
	}
	return n, true
}

// enrichKnockoutResolution fills ns.RegulationHomeScore, RegulationAwayScore, and
// KnockoutResolution by reading linescores from the ESPN event summary.
//
// Linescore layout per competitor (from ESPN summary header.competitions[0].competitors):
//   period 0: 1st half
//   period 1: 2nd half
//   period 2: 1st ET half  (only present if ET occurred)
//   period 3: 2nd ET half  (only present if ET occurred)
//   period 4: penalties    (only present for STATUS_FINAL_PEN)
//
// Regulation score = sum of periods 0+1.
// If len(linescores) >= 3 and espnStatus != STATUS_FINAL_PEN → extra_time.
// If espnStatus == STATUS_FINAL_PEN → penalties.
// Otherwise → regulation.
func enrichKnockoutResolution(summary *espn.EventSummary, espnStatus string, ns *newState) {
	if len(summary.Header.Competitions) == 0 {
		return
	}
	comps := summary.Header.Competitions[0].Competitors
	var homeLs, awayLs []espn.SummaryLinescore
	for _, c := range comps {
		switch c.HomeAway {
		case "home":
			homeLs = c.Linescores
		case "away":
			awayLs = c.Linescores
		}
	}
	if len(homeLs) < 2 || len(awayLs) < 2 {
		return
	}

	sumLS := func(ls []espn.SummaryLinescore, periods int) int {
		total := 0
		for i := 0; i < periods && i < len(ls); i++ {
			n, err := strconv.Atoi(ls[i].DisplayValue)
			if err == nil && n >= 0 {
				total += n
			}
		}
		return total
	}

	regHome := sumLS(homeLs, 2)
	regAway := sumLS(awayLs, 2)
	ns.RegulationHomeScore = &regHome
	ns.RegulationAwayScore = &regAway

	switch {
	case espnStatus == "STATUS_FINAL_PEN":
		ns.KnockoutResolution = "penalties"
	case len(homeLs) >= 3:
		ns.KnockoutResolution = "extra_time"
	default:
		ns.KnockoutResolution = "regulation"
	}
}

func parseTime(s string) (time.Time, error) {
	for _, f := range []string{time.RFC3339, "2006-01-02T15:04:05Z", "2006-01-02T15:04Z"} {
		if t, err := time.Parse(f, s); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time %q", s)
}
