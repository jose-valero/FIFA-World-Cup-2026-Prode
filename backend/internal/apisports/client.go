package apisports

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

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
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-apisports-key", c.apiKey)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("api-sports teams search failed with status %d", res.StatusCode)
	}

	var payload TeamsResponse
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return nil, err
	}

	return &payload, nil
}

func (c *Client) GetSquadByTeamID(ctx context.Context, teamID int) (*SquadResponse, error) {
	endpoint := fmt.Sprintf("%s/players/squads?team=%d", c.baseURL, teamID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-apisports-key", c.apiKey)

	res, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("api-sports squad failed with status %d", res.StatusCode)
	}

	var payload SquadResponse
	if err := json.NewDecoder(res.Body).Decode(&payload); err != nil {
		return nil, err
	}

	return &payload, nil
}
