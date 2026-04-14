package apisports

import (
	"context"
	"errors"
	"strconv"
	"strings"

	api "quiniela-backend/internal/apisports"
	"quiniela-backend/internal/providers"
)

var ErrExternalTeamNotResolved = errors.New("external team not resolved")

type TeamProvider struct {
	client *api.Client
}

func NewTeamProvider(client *api.Client) *TeamProvider {
	return &TeamProvider{
		client: client,
	}
}

func (p *TeamProvider) Name() string {
	return "api-sports"
}

func (p *TeamProvider) GetTeamSnapshot(ctx context.Context, input providers.TeamLookupInput) (*providers.TeamSnapshot, error) {
	externalTeam, err := p.resolveExternalTeam(ctx, input)
	if err != nil {
		return nil, err
	}

	squad, err := p.client.GetSquadByTeamID(ctx, externalTeam.Team.ID)
	if err != nil {
		// comportamiento tolerante: si falla el squad,
		// igual devolvemos el detalle base del equipo
		return mapTeamSnapshot(externalTeam, nil), nil
	}

	return mapTeamSnapshot(externalTeam, squad), nil
}

func (p *TeamProvider) resolveExternalTeam(ctx context.Context, input providers.TeamLookupInput) (*api.TeamSearchResult, error) {
	resp, err := p.client.GetTeamsBySearch(ctx, input.TeamName)
	if err != nil {
		return nil, err
	}

	if len(resp.Response) == 0 {
		return nil, ErrExternalTeamNotResolved
	}

	best, ok := selectBestExternalTeam(resp.Response, input)
	if !ok {
		return nil, ErrExternalTeamNotResolved
	}

	return best, nil
}

func selectBestExternalTeam(candidates []api.TeamSearchResult, input providers.TeamLookupInput) (*api.TeamSearchResult, bool) {
	if len(candidates) == 0 {
		return nil, false
	}

	bestIndex := -1
	bestScore := -1

	for i, candidate := range candidates {
		score := scoreExternalTeamCandidate(candidate, input)

		if score > bestScore {
			bestScore = score
			bestIndex = i
		}
	}

	if bestIndex < 0 || bestScore < 50 {
		return nil, false
	}

	return &candidates[bestIndex], true
}

func scoreExternalTeamCandidate(candidate api.TeamSearchResult, input providers.TeamLookupInput) int {
	score := 0

	if input.TeamCode != nil && candidate.Team.Code != nil && strings.EqualFold(*input.TeamCode, *candidate.Team.Code) {
		score += 100
	}

	if candidate.Team.National != nil && *candidate.Team.National {
		score += 40
	}

	if normalize(candidate.Team.Name) == normalize(input.TeamName) {
		score += 60
	}

	if candidate.Team.Country != nil && normalize(*candidate.Team.Country) == normalize(input.TeamName) {
		score += 20
	}

	if input.TeamShortName != nil && normalize(candidate.Team.Name) == normalize(*input.TeamShortName) {
		score += 20
	}

	return score
}

func mapTeamSnapshot(teamResult *api.TeamSearchResult, squad *api.SquadResponse) *providers.TeamSnapshot {
	snapshot := &providers.TeamSnapshot{
		Provider:  "api-sports",
		Name:      teamResult.Team.Name,
		Code:      teamResult.Team.Code,
		Country:   teamResult.Team.Country,
		LogoURL:   teamResult.Team.Logo,
		Founded:   teamResult.Team.Founded,
		National:  teamResult.Team.National,
		VenueName: teamResult.Venue.Name,
		VenueCity: teamResult.Venue.City,
		Players:   []providers.Player{},
	}

	providerTeamID := intToString(teamResult.Team.ID)
	snapshot.ProviderTeamID = &providerTeamID

	if squad != nil && len(squad.Response) > 0 {
		for _, player := range squad.Response[0].Players {
			snapshot.Players = append(snapshot.Players, providers.Player{
				ProviderPlayerID: intToString(player.ID),
				Name:             player.Name,
				FirstName:        nil,
				LastName:         nil,
				Age:              player.Age,
				Number:           player.Number,
				Position:         player.Position,
				PhotoURL:         player.Photo,
			})
		}
	}

	return snapshot
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

func intToString(value int) string {
	return strconv.Itoa(value)
}
