// Package matchdetail fetches a single match from Supabase and enriches it
// with live ESPN data (scoring plays, live clock). ESPN failures are silent:
// the base DB response is always returned.
package matchdetail

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"quiniela-backend/internal/espn"
)

// ErrNotFound is returned when the matchId does not exist in the DB.
var ErrNotFound = errors.New("match not found")

// ── Response types ────────────────────────────────────────────────────────────

// Response is the enriched payload returned to the frontend.
type Response struct {
	ID           string   `json:"id"`
	Stage        string   `json:"stage"`
	Group        string   `json:"group"`
	GroupCode    *string  `json:"groupCode"`
	KickoffAt    string   `json:"kickoffAt"`
	Status       string   `json:"status"`
	MinuteLabel  *string  `json:"minuteLabel"`
	VenueName    string   `json:"venueName"`
	VenueCity    string   `json:"venueCity"`
	HomeTeam     TeamInfo `json:"homeTeam"`
	AwayTeam     TeamInfo `json:"awayTeam"`
	Score        *Score   `json:"score"`
	Events       []Event  `json:"events"`
	EspnEnriched bool     `json:"espnEnriched"`
}

// TeamInfo identifies one side of the match.
type TeamInfo struct {
	Name string `json:"name"`
	Code string `json:"code"`
}

// Score holds the official result.
type Score struct {
	Home int `json:"home"`
	Away int `json:"away"`
}

// Event is a single scoring play displayed beneath the score.
type Event struct {
	Minute string `json:"minute"`
	Side   string `json:"side"`   // "home" | "away"
	Type   string `json:"type"`   // "goal" | "penalty_goal" | "own_goal"
	Player string `json:"player"`
	Label  string `json:"label"`
}

// ── DB row ────────────────────────────────────────────────────────────────────

type dbMatch struct {
	ID           string  `json:"id"`
	Stage        string  `json:"stage"`
	GroupName    string  `json:"group_name"`
	GroupCode    *string `json:"group_code"`
	HomeTeam     string  `json:"home_team"`
	AwayTeam     string  `json:"away_team"`
	HomeTeamCode *string `json:"home_team_code"`
	AwayTeamCode *string `json:"away_team_code"`
	KickoffAt    string  `json:"kickoff_at"`
	Stadium      string  `json:"stadium"`
	City         string  `json:"city"`
	Status       string  `json:"status"`
	HomeScore    *int    `json:"official_home_score"`
	AwayScore    *int    `json:"official_away_score"`
	ESPNEventID  *string `json:"espn_event_id"`
}

// ── Public API ────────────────────────────────────────────────────────────────

// Fetch returns the enriched match detail for the given matchID.
// If ESPN enrichment fails it is silently omitted; only ErrNotFound is fatal.
func Fetch(ctx context.Context, supabaseURL, supabaseKey string, espnClient *espn.Client, matchID string) (*Response, error) {
	m, err := fetchDBMatch(ctx, supabaseURL, supabaseKey, matchID)
	if err != nil {
		return nil, err
	}

	resp := buildBaseResponse(m)

	if m.ESPNEventID != nil && *m.ESPNEventID != "" {
		espnID := *m.ESPNEventID

		var teamSides map[string]string

		summary, summaryErr := espnClient.GetEventSummary(ctx, espnID)
		if summaryErr == nil {
			enrichFromESPN(resp, summary)
			resp.EspnEnriched = true
			teamSides = buildTeamSides(summary)
		}

		// Fetch play-by-play events (primary source for goals/cards/subs).
		// Falls back to keyMoments then scoringPlays from summary.
		resp.Events = fetchEvents(ctx, espnClient, espnID, summary, teamSides)
	}

	return resp, nil
}

// ── Supabase fetch ────────────────────────────────────────────────────────────

func fetchDBMatch(ctx context.Context, supabaseURL, key, matchID string) (*dbMatch, error) {
	url := supabaseURL + "/rest/v1/matches" +
		"?select=id,stage,group_name,group_code,home_team,away_team,home_team_code,away_team_code" +
		",kickoff_at,stadium,city,status,official_home_score,official_away_score,espn_event_id" +
		"&id=eq." + matchID +
		"&limit=1"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching match from Supabase: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Supabase returned %d: %s", resp.StatusCode, body)
	}

	var rows []dbMatch
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decoding match: %w", err)
	}
	if len(rows) == 0 {
		return nil, ErrNotFound
	}
	return &rows[0], nil
}

// ── Base response from DB ─────────────────────────────────────────────────────

func buildBaseResponse(m *dbMatch) *Response {
	homeCode := ""
	if m.HomeTeamCode != nil {
		homeCode = *m.HomeTeamCode
	}
	awayCode := ""
	if m.AwayTeamCode != nil {
		awayCode = *m.AwayTeamCode
	}

	r := &Response{
		ID:        m.ID,
		Stage:     m.Stage,
		Group:     m.GroupName,
		GroupCode: m.GroupCode,
		KickoffAt: m.KickoffAt,
		Status:    m.Status,
		VenueName: m.Stadium,
		VenueCity: m.City,
		HomeTeam:  TeamInfo{Name: m.HomeTeam, Code: homeCode},
		AwayTeam:  TeamInfo{Name: m.AwayTeam, Code: awayCode},
		Events:    []Event{},
	}

	if m.HomeScore != nil && m.AwayScore != nil {
		r.Score = &Score{Home: *m.HomeScore, Away: *m.AwayScore}
	}

	return r
}

// ── ESPN enrichment ───────────────────────────────────────────────────────────

func enrichFromESPN(r *Response, s *espn.EventSummary) {
	if len(s.Header.Competitions) == 0 {
		return
	}
	comp := s.Header.Competitions[0]

	// Status (ESPN is more up-to-date for live matches)
	if mapped, ok := mapESPNStatus(comp.Status.Type.Name); ok {
		r.Status = mapped
	}

	// Minute label — only meaningful when live
	if r.Status == "live" && comp.Status.DisplayClock != "" {
		label := comp.Status.DisplayClock
		r.MinuteLabel = &label
	}

	// Score from ESPN (preferred for live; already set from DB as fallback)
	home, away := scorePair(comp.Competitors)
	if home != nil && away != nil {
		r.Score = &Score{Home: *home, Away: *away}
	}

}

// ── Helpers ───────────────────────────────────────────────────────────────────

func scorePair(comps []espn.SummaryCompetitor) (home, away *int) {
	for _, c := range comps {
		var n int
		if _, err := fmt.Sscanf(c.Score, "%d", &n); err != nil || n < 0 {
			continue
		}
		v := n
		if c.HomeAway == "home" {
			home = &v
		} else {
			away = &v
		}
	}
	return
}

func firstPlayerName(participants []espn.ScoringParticipant) string {
	if len(participants) == 0 {
		return ""
	}
	a := participants[0].Athlete
	if a.ShortName != "" {
		return a.ShortName
	}
	return a.DisplayName
}

// buildTeamSides builds a teamID→"home"|"away" map from the summary competitors.
func buildTeamSides(s *espn.EventSummary) map[string]string {
	sides := make(map[string]string)
	if len(s.Header.Competitions) == 0 {
		return sides
	}
	for _, c := range s.Header.Competitions[0].Competitors {
		if c.Team.ID != "" {
			sides[c.Team.ID] = c.HomeAway
		}
	}
	return sides
}

// fetchEvents returns match events, trying sources in order of reliability:
//  1. Core API plays endpoint (primary: goals + cards + subs, boolean flags)
//  2. keyMoments from summary (ESPN soccer rarely uses this, kept as fallback)
//  3. scoringPlays from summary (goals only, last resort)
func fetchEvents(ctx context.Context, client *espn.Client, espnID string, summary *espn.EventSummary, teamSides map[string]string) []Event {
	// 1. Core API plays (primary)
	corePlays, err := client.GetEventPlays(ctx, espnID)
	if err == nil {
		if events := eventsFromCorePlays(corePlays, teamSides); len(events) > 0 {
			return events
		}
	}

	if summary == nil || len(summary.Header.Competitions) == 0 {
		return []Event{}
	}
	comp := summary.Header.Competitions[0]

	// 2. keyMoments from summary (site API fallback)
	if events := eventsFromPlays(summary.KeyMoments, teamSides); len(events) > 0 {
		return events
	}

	// 3. scoringPlays from summary (goals only, last resort)
	if events := eventsFromScoringPlays(summary.ScoringPlays, teamSides, comp.Competitors); len(events) > 0 {
		return events
	}

	return []Event{}
}

// ── Core API event helpers ────────────────────────────────────────────────────

// corePlayEventType maps Core API boolean flags to our event type enum.
// Boolean flags are more reliable than type.text string matching.
func corePlayEventType(p espn.CorePlay) (string, bool) {
	switch {
	case p.OwnGoal:
		return "own_goal", true
	case p.PenaltyKick && p.ScoringPlay:
		return "penalty_goal", true
	case p.ScoringPlay:
		return "goal", true
	case p.YellowCard:
		return "yellow_card", true
	case p.RedCard:
		return "red_card", true
	case p.Substitution:
		return "substitution", true
	default:
		return "", false
	}
}

// teamIDFromRef extracts the numeric ID from an ESPN Core API $ref URL.
// Core API refs include query params (e.g. "?lang=en&region=us") that must be
// stripped before path extraction, otherwise the lookup in teamSides fails.
// e.g. ".../teams/12345?lang=en" → "12345"
func teamIDFromRef(ref string) string {
	if q := strings.Index(ref, "?"); q >= 0 {
		ref = ref[:q]
	}
	ref = strings.TrimRight(ref, "/")
	i := strings.LastIndex(ref, "/")
	if i < 0 || i == len(ref)-1 {
		return ""
	}
	return ref[i+1:]
}

// corePlayerName resolves a player name from a Core API play.
// Prefers inline athlete data (no extra HTTP call); falls back to ShortText then Text.
func corePlayerName(p espn.CorePlay) string {
	if len(p.Participants) > 0 {
		a := p.Participants[0].Athlete
		if a.ShortName != "" {
			return a.ShortName
		}
		if a.DisplayName != "" {
			return a.DisplayName
		}
	}
	if p.ShortText != "" {
		return p.ShortText
	}
	return p.Text
}

// eventsFromCorePlays converts Core API plays to our Event slice,
// filtering to only the event types meaningful for the UI.
func eventsFromCorePlays(plays []espn.CorePlay, teamSides map[string]string) []Event {
	var events []Event
	for _, p := range plays {
		eventType, ok := corePlayEventType(p)
		if !ok {
			continue
		}
		side := teamSides[teamIDFromRef(p.Team.Ref)]
		if side == "" {
			continue // skip: cannot resolve team side reliably
		}
		player := corePlayerName(p)
		minute := p.Clock.DisplayValue
		events = append(events, Event{
			Minute: minute,
			Side:   side,
			Type:   eventType,
			Player: player,
			Label:  buildEventLabel(minute, player),
		})
	}
	return events
}

// eventsFromPlays extracts relevant events from an ESPN Play slice.
// Only goal, card, and substitution types are included; all other plays are skipped.
func eventsFromPlays(plays []espn.Play, teamSides map[string]string) []Event {
	var events []Event
	for _, p := range plays {
		eventType, ok := mapPlayTypeFromText(p.Type.Text)
		if !ok {
			continue
		}
		player := firstPlayerName(p.Participants)
		minute := p.Clock.DisplayValue
		side := teamSides[p.Team.ID]
		if side == "" {
			continue // skip: cannot resolve team side reliably
		}
		events = append(events, Event{
			Minute: minute,
			Side:   side,
			Type:   eventType,
			Player: player,
			Label:  buildEventLabel(minute, player),
		})
	}
	return events
}

// eventsFromScoringPlays extracts goal events from the scoring plays array (goals only).
// comps is passed to resolve the home/away side as a fallback for older ESPN responses.
func eventsFromScoringPlays(plays []espn.ScoringPlay, teamSides map[string]string, comps []espn.SummaryCompetitor) []Event {
	var events []Event
	for _, sp := range plays {
		player := firstPlayerName(sp.Participants)
		minute := sp.Clock.DisplayValue
		side := teamSides[sp.Team.ID]
		if side == "" {
			// secondary lookup: linear search through summary competitors
			for _, c := range comps {
				if c.Team.ID == sp.Team.ID {
					side = c.HomeAway
					break
				}
			}
		}
		if side == "" {
			continue // skip: cannot resolve team side reliably
		}
		eventType, _ := mapPlayTypeFromText(sp.Type.Text)
		if eventType == "" {
			eventType = "goal"
		}
		events = append(events, Event{
			Minute: minute,
			Side:   side,
			Type:   eventType,
			Player: player,
			Label:  buildEventLabel(minute, player),
		})
	}
	return events
}

// mapPlayTypeFromText maps an ESPN play type text to our event type enum.
// Returns ("", false) for play types we don't surface (fouls, corners, etc.).
func mapPlayTypeFromText(text string) (string, bool) {
	lower := strings.ToLower(text)
	switch {
	case strings.Contains(lower, "own goal"):
		return "own_goal", true
	case strings.Contains(lower, "penalty") && strings.Contains(lower, "goal"):
		return "penalty_goal", true
	case strings.Contains(lower, "goal") || strings.Contains(lower, "score"):
		return "goal", true
	case strings.Contains(lower, "yellow card"):
		return "yellow_card", true
	case strings.Contains(lower, "red card"):
		return "red_card", true
	case strings.Contains(lower, "substitut"):
		return "substitution", true
	default:
		return "", false
	}
}

func buildEventLabel(minute, player string) string {
	if player == "" {
		return minute
	}
	return minute + " " + player
}

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
	case "STATUS_FINAL", "STATUS_FULL_TIME":
		return "finished", true
	default:
		return "", false
	}
}
