package espn

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type athleteResponse struct {
	Athlete espnAthleteDetail `json:"athlete"`
}

type espnAthleteDetail struct {
	ID          string  `json:"id"`
	DisplayName *string `json:"displayName"`
	FirstName   *string `json:"firstName"`
	LastName    *string `json:"lastName"`
	Age         *int    `json:"age"`
	Jersey      *string `json:"jersey"`
	Position    *struct {
		DisplayName *string `json:"displayName"`
	} `json:"position"`
	Headshot *struct {
		Href *string `json:"href"`
	} `json:"headshot"`
	BirthPlace *struct {
		City    *string `json:"city"`
		Country *string `json:"country"`
	} `json:"birthPlace"`
	DateOfBirth   *string `json:"dateOfBirth"`
	DisplayHeight *string `json:"displayHeight"`
	DisplayWeight *string `json:"displayWeight"`
}

type StatusError struct {
	Endpoint string
	Status   int
	Body     string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("espn request failed: endpoint=%s status=%d body=%q", e.Endpoint, e.Status, e.Body)
}

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

type teamListResponse struct {
	Sports []struct {
		Leagues []struct {
			Teams []struct {
				Team espnTeam `json:"team"`
			} `json:"teams"`
		} `json:"leagues"`
	} `json:"sports"`
}

type teamDetailResponse struct {
	Team espnTeam `json:"team"`
}

type rosterResponse struct {
	Athletes []espnAthlete `json:"athletes"`
}

type espnTeam struct {
	ID               string     `json:"id"`
	UID              string     `json:"uid"`
	Slug             string     `json:"slug"`
	Abbreviation     *string    `json:"abbreviation"`
	Name             string     `json:"name"`
	ShortDisplayName *string    `json:"shortDisplayName"`
	DisplayName      *string    `json:"displayName"`
	Location         *string    `json:"location"`
	IsNational       *bool      `json:"isNational"`
	Logos            []espnLogo `json:"logos"`
	Venue            *espnVenue `json:"venue"`
}

type espnLogo struct {
	Href *string `json:"href"`
}

type espnVenue struct {
	FullName *string `json:"fullName"`
	Address  *struct {
		City *string `json:"city"`
	} `json:"address"`
}

type espnAthlete struct {
	ID          string  `json:"id"`
	DisplayName string  `json:"displayName"`
	FirstName   *string `json:"firstName"`
	LastName    *string `json:"lastName"`
	Age         *int    `json:"age"`
	Jersey      *string `json:"jersey"`
	Position    *struct {
		DisplayName *string `json:"displayName"`
	} `json:"position"`
	Headshot *struct {
		Href *string `json:"href"`
	} `json:"headshot"`
}

func (c *Client) GetLeagueTeams(ctx context.Context, sport, league string) ([]espnTeam, error) {
	endpoint := fmt.Sprintf("%s/sports/%s/%s/teams", c.baseURL, sport, league)

	var payload teamListResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	if len(payload.Sports) == 0 || len(payload.Sports[0].Leagues) == 0 {
		return []espnTeam{}, nil
	}

	rawTeams := payload.Sports[0].Leagues[0].Teams
	result := make([]espnTeam, 0, len(rawTeams))

	for _, item := range rawTeams {
		result = append(result, item.Team)
	}

	return result, nil
}

func (c *Client) GetTeamDetail(ctx context.Context, sport, league, teamID string) (*espnTeam, error) {
	endpoint := fmt.Sprintf("%s/sports/%s/%s/teams/%s", c.baseURL, sport, league, teamID)

	var payload teamDetailResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	if payload.Team.ID == "" {
		return nil, nil
	}

	return &payload.Team, nil
}

func (c *Client) GetTeamRoster(ctx context.Context, sport, league, teamID string) ([]espnAthlete, error) {
	endpoint := fmt.Sprintf("%s/sports/%s/%s/teams/%s/roster", c.baseURL, sport, league, teamID)

	var payload rosterResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	return payload.Athletes, nil
}

func (c *Client) getJSON(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Accept", "application/json")

	res, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(io.LimitReader(res.Body, 2000))
		body := strings.TrimSpace(string(bodyBytes))

		return &StatusError{
			Endpoint: endpoint,
			Status:   res.StatusCode,
			Body:     body,
		}
	}

	if err := json.NewDecoder(res.Body).Decode(target); err != nil {
		return err
	}

	return nil
}

func (c *Client) GetAthleteDetail(ctx context.Context, sport, league, athleteID string) (*espnAthleteDetail, error) {
	endpoint := fmt.Sprintf("%s/sports/%s/%s/athletes/%s", c.baseURL, sport, league, athleteID)

	var payload athleteResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	if payload.Athlete.ID == "" {
		return nil, nil
	}

	return &payload.Athlete, nil
}
