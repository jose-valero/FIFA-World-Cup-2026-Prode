package apisports

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type StatusError struct {
	Endpoint string
	Status   int
	Body     string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("api-sports request failed: endpoint=%s status=%d body=%q", e.Endpoint, e.Status, e.Body)
}

type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

func (c *Client) GetTeamsBySearch(ctx context.Context, search string) (*TeamsResponse, error) {
	endpoint := fmt.Sprintf("%s/teams?search=%s", c.baseURL, url.QueryEscape(search))

	var payload TeamsResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *Client) GetSquadByTeamID(ctx context.Context, teamID int) (*SquadResponse, error) {
	endpoint := fmt.Sprintf("%s/players/squads?team=%d", c.baseURL, teamID)

	var payload SquadResponse
	if err := c.getJSON(ctx, endpoint, &payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *Client) getJSON(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	req.Header.Set("x-apisports-key", c.apiKey)
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
