// Package sync provides logic for synchronizing match state from ESPN into Supabase.
package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"quiniela-backend/internal/espn"
)

// Result summarizes the outcome of a sync run.
type Result struct {
	TotalReviewed int           `json:"total_reviewed"`
	TotalUpdated  int           `json:"total_updated"`
	TotalUnchanged int          `json:"total_unchanged"`
	TotalOmitted  int           `json:"total_omitted"`
	Changes       []Change      `json:"changes"`
	Omissions     []Omission    `json:"omissions,omitempty"`
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
	Status    string `json:"status"`
	HomeScore *int   `json:"home_score"`
	AwayScore *int   `json:"away_score"`
}

// dbMatch is a row from Supabase with only the fields relevant to sync.
type dbMatch struct {
	ID          string  `json:"id"`
	ESPNEventID string  `json:"espn_event_id"`
	KickoffAt   string  `json:"kickoff_at"`
	Status      string  `json:"status"`
	HomeScore   *int    `json:"official_home_score"`
	AwayScore   *int    `json:"official_away_score"`
}

// patchPayload is what we send to Supabase REST to update a match.
type patchPayload struct {
	Status    string `json:"status"`
	HomeScore *int   `json:"official_home_score"`
	AwayScore *int   `json:"official_away_score"`
}

// ESPNMatches fetches ESPN scoreboard data for all matches that have an
// espn_event_id, computes the state diff, and applies updates to Supabase.
//
// Matches without espn_event_id are silently ignored.
// Already-finished matches in the DB are never reverted.
// A finished transition is only written if ESPN supplies both valid scores.
func ESPNMatches(ctx context.Context, espnClient *espn.Client, supabaseURL, supabaseKey string) (*Result, error) {
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
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      "espn event not found in scoreboard",
			})
			continue
		}

		newStatus, newHome, newAway, omitReason := computeNewState(m, ev)
		if omitReason != "" {
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      omitReason,
			})
			continue
		}

		if !stateChanged(m, newStatus, newHome, newAway) {
			result.TotalUnchanged++
			continue
		}

		before := MatchState{Status: m.Status, HomeScore: m.HomeScore, AwayScore: m.AwayScore}
		after := MatchState{Status: newStatus, HomeScore: newHome, AwayScore: newAway}

		if err := patchMatch(ctx, supabaseURL, supabaseKey, m.ID, patchPayload{
			Status:    newStatus,
			HomeScore: newHome,
			AwayScore: newAway,
		}); err != nil {
			result.TotalOmitted++
			result.Omissions = append(result.Omissions, Omission{
				MatchID:     m.ID,
				ESPNEventID: m.ESPNEventID,
				Reason:      fmt.Sprintf("patch failed: %v", err),
			})
			continue
		}

		result.TotalUpdated++
		result.Changes = append(result.Changes, Change{
			MatchID:     m.ID,
			ESPNEventID: m.ESPNEventID,
			Before:      before,
			After:       after,
		})
	}

	return result, nil
}

// computeNewState maps an ESPN event to the target DB state for a match.
// Returns an omit reason (non-empty) if the match should be skipped.
func computeNewState(m dbMatch, ev espn.Event) (status string, homeScore *int, awayScore *int, omitReason string) {
	// Never revert a match that is already finished in the DB.
	if m.Status == "finished" {
		return "", nil, nil, "already finished in DB — not reverting"
	}

	espnStatus := ev.StatusName()
	newStatus, ok := mapESPNStatus(espnStatus)
	if !ok {
		return "", nil, nil, fmt.Sprintf("unknown ESPN status %q", espnStatus)
	}

	switch newStatus {
	case "scheduled":
		// Constraint: scheduled must have null scores.
		return "scheduled", nil, nil, ""

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
		return "live", hp, ap, ""

	case "finished":
		home, homeOK := parseScore(ev.HomeScore())
		away, awayOK := parseScore(ev.AwayScore())
		if !homeOK || !awayOK {
			// Constraint: finished must have both scores. Skip if ESPN hasn't provided them.
			return "", nil, nil, fmt.Sprintf("ESPN status is finished but scores not available (home=%q away=%q)", ev.HomeScore(), ev.AwayScore())
		}
		return "finished", &home, &away, ""
	}

	return "", nil, nil, fmt.Sprintf("unhandled status %q", newStatus)
}

// mapESPNStatus converts an ESPN status name to our DB enum.
// Returns (status, true) on success, ("", false) for unknown/unsupported statuses.
func mapESPNStatus(name string) (string, bool) {
	switch name {
	case "STATUS_SCHEDULED":
		return "scheduled", true
	case "STATUS_IN_PROGRESS", "STATUS_HALFTIME", "STATUS_END_PERIOD",
		"STATUS_EXTRA_TIME", "STATUS_SHOOTOUT":
		return "live", true
	case "STATUS_FINAL":
		return "finished", true
	default:
		return "", false
	}
}

// stateChanged returns true if any of the three sync fields differ from the DB row.
func stateChanged(m dbMatch, newStatus string, newHome *int, newAway *int) bool {
	if m.Status != newStatus {
		return true
	}
	if !intPtrEqual(m.HomeScore, newHome) {
		return true
	}
	if !intPtrEqual(m.AwayScore, newAway) {
		return true
	}
	return false
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
		"?select=id,espn_event_id,kickoff_at,status,official_home_score,official_away_score" +
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

func parseTime(s string) (time.Time, error) {
	for _, f := range []string{time.RFC3339, "2006-01-02T15:04:05Z", "2006-01-02T15:04Z"} {
		if t, err := time.Parse(f, s); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time %q", s)
}
