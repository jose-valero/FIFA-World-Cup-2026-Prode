package espn

import (
	"context"
	"errors"
	"strconv"
	"strings"

	"quiniela-backend/internal/providers"
)

var ErrExternalTeamNotResolved = errors.New("espn external team not resolved")

type TeamProvider struct {
	client *Client
}

func NewTeamProvider(client *Client) *TeamProvider {
	return &TeamProvider{
		client: client,
	}
}

func (p *TeamProvider) Name() string {
	return "espn"
}

func (p *TeamProvider) GetTeamSnapshot(ctx context.Context, input providers.TeamLookupInput) (*providers.TeamSnapshot, error) {
	sport, league := resolveLeague(input.CompetitionKey, input.EditionKey)

	teams, err := p.client.GetLeagueTeams(ctx, sport, league)
	if err != nil {
		return nil, err
	}

	externalTeam, ok := selectBestEspnTeam(teams, input)
	if !ok {
		return nil, ErrExternalTeamNotResolved
	}

	teamDetail, err := p.client.GetTeamDetail(ctx, sport, league, externalTeam.ID)
	if err != nil {
		return nil, err
	}

	if teamDetail == nil {
		teamDetail = &externalTeam
	}

	roster, err := p.client.GetTeamRoster(ctx, sport, league, externalTeam.ID)
	if err != nil {
		return mapTeamSnapshot(teamDetail, nil), nil
	}

	return mapTeamSnapshot(teamDetail, roster), nil
}

func resolveLeague(competitionKey, editionKey string) (string, string) {
	// Por ahora solo World Cup 2026.
	// Ya está preparado para crecer luego.
	switch competitionKey {
	case "world_cup":
		return "soccer", "fifa.world"
	default:
		return "soccer", "fifa.world"
	}
}

func selectBestEspnTeam(candidates []espnTeam, input providers.TeamLookupInput) (espnTeam, bool) {
	bestIndex := -1
	bestScore := -1

	for i, candidate := range candidates {
		score := scoreEspnTeamCandidate(candidate, input)

		if score > bestScore {
			bestScore = score
			bestIndex = i
		}
	}

	if bestIndex < 0 || bestScore < 50 {
		return espnTeam{}, false
	}

	return candidates[bestIndex], true
}

func scoreEspnTeamCandidate(candidate espnTeam, input providers.TeamLookupInput) int {
	score := 0

	if input.TeamCode != nil && candidate.Abbreviation != nil && strings.EqualFold(*input.TeamCode, *candidate.Abbreviation) {
		score += 100
	}

	if candidate.IsNational != nil && *candidate.IsNational {
		score += 40
	}

	if normalize(candidate.Name) == normalize(input.TeamName) {
		score += 60
	}

	if candidate.DisplayName != nil && normalize(*candidate.DisplayName) == normalize(input.TeamName) {
		score += 50
	}

	if input.TeamShortName != nil && candidate.ShortDisplayName != nil && normalize(*candidate.ShortDisplayName) == normalize(*input.TeamShortName) {
		score += 20
	}

	if candidate.Location != nil && normalize(*candidate.Location) == normalize(input.TeamName) {
		score += 20
	}

	return score
}

func mapTeamSnapshot(team *espnTeam, athletes []espnAthlete) *providers.TeamSnapshot {
	snapshot := &providers.TeamSnapshot{
		Provider:       "espn",
		ProviderTeamID: &team.ID,
		Name:           firstNonEmpty(team.DisplayName, &team.Name),
		Code:           team.Abbreviation,
		Country:        team.Location,
		LogoURL:        firstLogo(team.Logos),
		Founded:        nil,
		National:       team.IsNational,
		VenueName:      nil,
		VenueCity:      nil,
		Players:        []providers.Player{},
	}

	if team.Venue != nil {
		snapshot.VenueName = team.Venue.FullName
		if team.Venue.Address != nil {
			snapshot.VenueCity = team.Venue.Address.City
		}
	}

	for _, athlete := range athletes {
		snapshot.Players = append(snapshot.Players, providers.Player{
			ProviderPlayerID: athlete.ID,
			Name:             athlete.DisplayName,
			FirstName:        athlete.FirstName,
			LastName:         athlete.LastName,
			Age:              athlete.Age,
			Number:           parseOptionalInt(athlete.Jersey),
			Position:         extractPosition(athlete),
			PhotoURL:         extractHeadshot(athlete),
		})
	}

	return snapshot
}

func parseOptionalInt(value *string) *int {
	if value == nil || strings.TrimSpace(*value) == "" {
		return nil
	}

	parsed, err := strconv.Atoi(strings.TrimSpace(*value))
	if err != nil {
		return nil
	}

	return &parsed
}

func extractPosition(athlete espnAthlete) *string {
	if athlete.Position == nil {
		return nil
	}
	return athlete.Position.DisplayName
}

func extractHeadshot(athlete espnAthlete) *string {
	if athlete.Headshot == nil {
		return nil
	}
	return athlete.Headshot.Href
}

func firstLogo(logos []espnLogo) *string {
	for _, logo := range logos {
		if logo.Href != nil && strings.TrimSpace(*logo.Href) != "" {
			return logo.Href
		}
	}
	return nil
}

func firstNonEmpty(values ...*string) string {
	for _, value := range values {
		if value != nil && strings.TrimSpace(*value) != "" {
			return *value
		}
	}
	return ""
}

func normalize(value string) string {
	value = strings.TrimSpace(strings.ToLower(value))
	replacer := strings.NewReplacer(
		"á", "a",
		"é", "e",
		"í", "i",
		"ó", "o",
		"ú", "u",
		"ü", "u",
	)
	return replacer.Replace(value)
}
