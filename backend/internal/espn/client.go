package espn

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client accesses ESPN's site API (scoreboard/summary) and Core API (play-by-play).
type Client struct {
	baseURL     string // site.api.espn.com — scoreboard, summary
	coreBaseURL string // sports.core.api.espn.com — plays
	httpClient  *http.Client
}

func NewClient(siteBaseURL, coreBaseURL string) *Client {
	return &Client{
		baseURL:     siteBaseURL,
		coreBaseURL: coreBaseURL,
		httpClient:  &http.Client{Timeout: 15 * time.Second},
	}
}

// Scoreboard represents the top-level response from ESPN's scoreboard endpoint.
type Scoreboard struct {
	Events []Event `json:"events"`
}

// Event is a single match/game in the ESPN scoreboard.
type Event struct {
	ID           string        `json:"id"`
	Date         string        `json:"date"`
	Competitions []Competition `json:"competitions"`
}

// Competition holds the competitor details for an event.
type Competition struct {
	Date        string       `json:"date"`
	Status      CompStatus   `json:"status"`
	Competitors []Competitor `json:"competitors"`
}

// CompStatus carries the game-state information for a competition.
type CompStatus struct {
	Type CompStatusType `json:"type"`
}

// CompStatusType is the machine-readable status of a competition.
type CompStatusType struct {
	Name      string `json:"name"`
	Completed bool   `json:"completed"`
}

// Competitor is one team in a competition.
type Competitor struct {
	HomeAway string `json:"homeAway"`
	Score    string `json:"score"`
	Team     Team   `json:"team"`
}

// Team holds the identifying info we use for matching.
type Team struct {
	ID           string `json:"id"`
	Abbreviation string `json:"abbreviation"`
}

// ── Event summary types (used by GetEventSummary) ────────────────────────────

// EventSummary is the response from ESPN's summary endpoint for a single event.
type EventSummary struct {
	Header struct {
		Competitions []SummaryCompetition `json:"competitions"`
	} `json:"header"`
	ScoringPlays []ScoringPlay `json:"scoringPlays"`
	KeyMoments   []Play        `json:"keyMoments"` // ESPN soccer sometimes uses keyMoments instead of scoringPlays
	Plays        []Play        `json:"plays"`
}

// ── Core API types ────────────────────────────────────────────────────────────

// corePlayCollection is the paged response from ESPN Core API plays endpoint.
type corePlayCollection struct {
	Count     int        `json:"count"`
	PageIndex int        `json:"pageIndex"`
	PageSize  int        `json:"pageSize"`
	PageCount int        `json:"pageCount"`
	Items     []CorePlay `json:"items"`
}

// CorePlay is a single play from the ESPN Core API plays endpoint.
// Boolean flags allow reliable event-type detection without text parsing.
type CorePlay struct {
	ID    string `json:"id"`
	Clock struct {
		DisplayValue string `json:"displayValue"`
	} `json:"clock"`
	Type struct {
		Text string `json:"text"`
	} `json:"type"`
	Text      string `json:"text"`
	ShortText string `json:"shortText"`
	Team      struct {
		Ref string `json:"$ref"`
	} `json:"team"`
	Participants []CoreParticipant `json:"participants"`
	ScoringPlay  bool              `json:"scoringPlay"`
	Substitution bool              `json:"substitution"`
	YellowCard   bool              `json:"yellowCard"`
	RedCard      bool              `json:"redCard"`
	PenaltyKick  bool              `json:"penaltyKick"`
	OwnGoal      bool              `json:"ownGoal"`
}

// CoreParticipant is an athlete entry in a Core API play.
// ShortName/DisplayName are often embedded inline; Ref is provided as fallback link.
type CoreParticipant struct {
	Athlete struct {
		Ref         string `json:"$ref"`
		ShortName   string `json:"shortName"`
		DisplayName string `json:"displayName"`
	} `json:"athlete"`
}

// SummaryCompetition holds live status and competitors from the summary response.
type SummaryCompetition struct {
	Status struct {
		DisplayClock string         `json:"displayClock"`
		Type         CompStatusType `json:"type"`
	} `json:"status"`
	Competitors []SummaryCompetitor `json:"competitors"`
}

// SummaryCompetitor is a team entry in the summary response (includes team ID).
type SummaryCompetitor struct {
	HomeAway string `json:"homeAway"`
	Score    string `json:"score"`
	Team     struct {
		ID string `json:"id"`
	} `json:"team"`
}

// ScoringPlay represents a goal or scoring event in the summary.
type ScoringPlay struct {
	Clock struct {
		DisplayValue string `json:"displayValue"`
	} `json:"clock"`
	Type struct {
		Text string `json:"text"`
	} `json:"type"`
	Team struct {
		ID string `json:"id"`
	} `json:"team"`
	Participants []ScoringParticipant `json:"participants"`
}

// ScoringParticipant is a player involved in a scoring play.
type ScoringParticipant struct {
	Athlete struct {
		ShortName   string `json:"shortName"`
		DisplayName string `json:"displayName"`
	} `json:"athlete"`
}

// Play is a single event from the play-by-play array in the summary response.
// Covers goals, cards, and substitutions (richer than ScoringPlays which is goals-only).
type Play struct {
	Clock struct {
		DisplayValue string `json:"displayValue"`
	} `json:"clock"`
	Type struct {
		Text string `json:"text"`
	} `json:"type"`
	Team struct {
		ID string `json:"id"`
	} `json:"team"`
	Participants []ScoringParticipant `json:"participants"`
}

// HomeAbbrev returns the home team's abbreviation for this event (empty if not found).
func (e Event) HomeAbbrev() string {
	return e.competitor("home").Team.Abbreviation
}

// AwayAbbrev returns the away team's abbreviation for this event (empty if not found).
func (e Event) AwayAbbrev() string {
	return e.competitor("away").Team.Abbreviation
}

// HomeScore returns the home team's raw score string from ESPN.
func (e Event) HomeScore() string {
	return e.competitor("home").Score
}

// AwayScore returns the away team's raw score string from ESPN.
func (e Event) AwayScore() string {
	return e.competitor("away").Score
}

// StatusName returns the ESPN status type name (e.g. "STATUS_FINAL").
func (e Event) StatusName() string {
	if len(e.Competitions) == 0 {
		return ""
	}
	return e.Competitions[0].Status.Type.Name
}

// KickoffTime parses the event's date field into a time.Time.
// ESPN uses multiple formats; we try the most common ones.
func (e Event) KickoffTime() (time.Time, error) {
	src := e.Date
	if len(e.Competitions) > 0 && e.Competitions[0].Date != "" {
		src = e.Competitions[0].Date
	}
	return parseESPNTime(src)
}

func (e Event) competitor(homeAway string) Competitor {
	if len(e.Competitions) == 0 {
		return Competitor{}
	}
	for _, c := range e.Competitions[0].Competitors {
		if c.HomeAway == homeAway {
			return c
		}
	}
	return Competitor{}
}

var espnTimeFormats = []string{
	time.RFC3339,
	"2006-01-02T15:04Z",
	"2006-01-02T15:04:05Z",
	"2006-01-02T15:04-07:00",
}

func parseESPNTime(s string) (time.Time, error) {
	for _, f := range espnTimeFormats {
		if t, err := time.Parse(f, s); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse ESPN time %q", s)
}

// GetEventPlays fetches the full play-by-play for a single ESPN event from the Core API.
// It paginates automatically (limit=300, up to 5 pages). Only the first page failure
// is fatal; subsequent page errors return what was already collected.
func (c *Client) GetEventPlays(ctx context.Context, eventID string) ([]CorePlay, error) {
	const (
		limit    = 300
		maxPages = 10
		league   = "fifa.world"
	)

	var all []CorePlay

	for page := 1; page <= maxPages; page++ {
		url := fmt.Sprintf(
			"%s/sports/soccer/leagues/%s/events/%s/competitions/%s/plays?limit=%d&page=%d",
			c.coreBaseURL, league, eventID, eventID, limit, page,
		)
		col, err := c.fetchPlayPage(ctx, url)
		if err != nil {
			if page == 1 {
				return nil, fmt.Errorf("ESPN core plays page 1: %w", err)
			}
			break
		}
		all = append(all, col.Items...)
		if col.PageCount == 0 || page >= col.PageCount {
			break
		}
	}

	return all, nil
}

func (c *Client) fetchPlayPage(ctx context.Context, url string) (*corePlayCollection, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	var col corePlayCollection
	if err := json.NewDecoder(resp.Body).Decode(&col); err != nil {
		return nil, fmt.Errorf("decoding: %w", err)
	}
	return &col, nil
}

// GetEventSummary fetches the detailed summary for a single ESPN event.
// It returns enriched live data: live clock, scoring plays, etc.
func (c *Client) GetEventSummary(ctx context.Context, eventID string) (*EventSummary, error) {
	url := fmt.Sprintf("%s/sports/soccer/fifa.world/summary?event=%s", c.baseURL, eventID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ESPN summary request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ESPN summary returned status %d for event %s", resp.StatusCode, eventID)
	}

	var summary EventSummary
	if err := json.NewDecoder(resp.Body).Decode(&summary); err != nil {
		return nil, fmt.Errorf("decoding ESPN summary: %w", err)
	}

	return &summary, nil
}

// GetScoreboard fetches the scoreboard for a given date (YYYYMMDD).
func (c *Client) GetScoreboard(ctx context.Context, date string) ([]Event, error) {
	url := fmt.Sprintf("%s/sports/soccer/fifa.world/scoreboard?dates=%s&limit=100", c.baseURL, date)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ESPN request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ESPN returned status %d for date %s", resp.StatusCode, date)
	}

	var sb Scoreboard
	if err := json.NewDecoder(resp.Body).Decode(&sb); err != nil {
		return nil, fmt.Errorf("decoding ESPN response: %w", err)
	}

	return sb.Events, nil
}
