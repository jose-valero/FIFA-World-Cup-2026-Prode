package teams

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type SupabaseRepository struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewSupabaseRepository(baseURL, apiKey string) *SupabaseRepository {
	return &SupabaseRepository{
		baseURL: strings.TrimRight(baseURL, "/"),
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 8 * time.Second,
		},
	}
}

type teamCatalogRow struct {
	ID         string  `json:"id"`
	Code       *string `json:"code"`
	Name       string  `json:"name"`
	ShortName  *string `json:"short_name"`
	EspnTeamID *string `json:"espn_team_id"`
}

type matchGroupRow struct {
	GroupCode *string `json:"group_code"`
}

func (r *SupabaseRepository) GetTeamCatalogByID(ctx context.Context, teamID string) (*TeamCatalogItem, error) {
	params := url.Values{}
	params.Set("select", "id,code,name,short_name,espn_team_id")
	params.Set("id", "eq."+teamID)
	params.Set("limit", "1")

	endpoint := fmt.Sprintf("%s/rest/v1/teams?%s", r.baseURL, params.Encode())

	var rows []teamCatalogRow
	if err := r.getJSON(ctx, endpoint, &rows); err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		return nil, nil
	}

	row := rows[0]
	fmt.Println("SUPABASE endpoint:", endpoint)
	fmt.Println("SUPABASE baseURL:", r.baseURL)

	return &TeamCatalogItem{
		ID:         row.ID,
		Code:       row.Code,
		Name:       row.Name,
		ShortName:  row.ShortName,
		EspnTeamID: row.EspnTeamID,
	}, nil

}

func (r *SupabaseRepository) GetWorldCupGroupByTeamCode(ctx context.Context, teamCode string) (*string, error) {
	params := url.Values{}
	params.Set("select", "group_code")
	params.Set("stage", "eq.group_stage")
	params.Set("group_code", "not.is.null")
	params.Set("or", fmt.Sprintf("(home_team_code.eq.%s,away_team_code.eq.%s)", teamCode, teamCode))
	params.Set("order", "kickoff_at.asc")
	params.Set("limit", "1")

	endpoint := fmt.Sprintf("%s/rest/v1/matches?%s", r.baseURL, params.Encode())

	var rows []matchGroupRow
	if err := r.getJSON(ctx, endpoint, &rows); err != nil {
		return nil, err
	}

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0].GroupCode, nil
}

func (r *SupabaseRepository) getJSON(ctx context.Context, endpoint string, target any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", r.apiKey)
	req.Header.Set("Authorization", "Bearer "+r.apiKey)
	req.Header.Set("Accept", "application/json")

	res, err := r.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("supabase request failed with status %d", res.StatusCode)
	}

	if err := json.NewDecoder(res.Body).Decode(target); err != nil {
		return err
	}

	return nil
}

func (r *SupabaseRepository) SaveEspnTeamID(ctx context.Context, teamID string, espnTeamID string) error {
	endpoint := fmt.Sprintf("%s/rest/v1/teams?id=eq.%s", r.baseURL, url.QueryEscape(teamID))

	body := strings.NewReader(fmt.Sprintf(`{"espn_team_id":"%s"}`, espnTeamID))

	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, endpoint, body)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", r.apiKey)
	req.Header.Set("Authorization", "Bearer "+r.apiKey)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	res, err := r.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 400 {
		return fmt.Errorf("supabase patch request failed with status %d", res.StatusCode)
	}

	return nil
}

func (r *SupabaseRepository) ListTeamsWithoutEspnMapping(ctx context.Context) ([]TeamCatalogItem, error) {
	params := url.Values{}
	params.Set("select", "id,code,name,short_name,espn_team_id")
	params.Set("or", "(espn_team_id.is.null,espn_team_id.eq.)")
	params.Set("order", "name.asc")

	endpoint := fmt.Sprintf("%s/rest/v1/teams?%s", r.baseURL, params.Encode())

	var rows []teamCatalogRow
	if err := r.getJSON(ctx, endpoint, &rows); err != nil {
		return nil, err
	}

	result := make([]TeamCatalogItem, 0, len(rows))

	for _, row := range rows {
		result = append(result, TeamCatalogItem{
			ID:         row.ID,
			Code:       row.Code,
			Name:       row.Name,
			ShortName:  row.ShortName,
			EspnTeamID: row.EspnTeamID,
		})
	}

	return result, nil
}
