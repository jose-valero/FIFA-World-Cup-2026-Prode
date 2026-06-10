package espn

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// Client accesses ESPN's public site API.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 15 * time.Second},
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
