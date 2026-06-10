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
		summary, espnErr := espnClient.GetEventSummary(ctx, *m.ESPNEventID)
		if espnErr == nil {
			enrichFromESPN(resp, summary)
			resp.EspnEnriched = true
		}
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

	// Scoring plays → events list
	for _, sp := range s.ScoringPlays {
		side := sideForTeam(sp.Team.ID, comp.Competitors)
		player := firstPlayerName(sp.Participants)
		minute := sp.Clock.DisplayValue

		label := minute
		if player != "" {
			label = minute + " " + player
		}

		r.Events = append(r.Events, Event{
			Minute: minute,
			Side:   side,
			Type:   mapPlayType(sp.Type.Text),
			Player: player,
			Label:  label,
		})
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

func sideForTeam(teamID string, comps []espn.SummaryCompetitor) string {
	for _, c := range comps {
		if c.Team.ID == teamID {
			return c.HomeAway
		}
	}
	return "home"
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

func mapPlayType(text string) string {
	lower := strings.ToLower(text)
	switch {
	case strings.Contains(lower, "own"):
		return "own_goal"
	case strings.Contains(lower, "penalty"):
		return "penalty_goal"
	default:
		return "goal"
	}
}

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
