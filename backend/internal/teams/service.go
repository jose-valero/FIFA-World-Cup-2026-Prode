package teams

import (
	"context"
	"errors"
	"strings"

	"quiniela-backend/internal/apisports"
)

var ErrTeamNotFound = errors.New("team not found")
var ErrExternalTeamNotResolved = errors.New("external team not resolved")

type Service struct {
	repo      Repository
	apiClient *apisports.Client
}

func NewService(repo Repository, apiClient *apisports.Client) *Service {
	return &Service{
		repo:      repo,
		apiClient: apiClient,
	}
}

func (s *Service) GetTeamDetail(ctx context.Context, teamID string) (*TeamDetail, error) {
	catalog, err := s.repo.GetTeamCatalogByID(ctx, teamID)
	if err != nil {
		return nil, err
	}
	if catalog == nil {
		return nil, ErrTeamNotFound
	}

	var group *string
	if catalog.Code != nil {
		group, _ = s.repo.GetWorldCupGroupByTeamCode(ctx, *catalog.Code)
	}

	confederation := ResolveConfederation(catalog.Code)

	searchTerm := catalog.Name
	externalTeam, err := s.resolveExternalTeam(ctx, catalog)
	if err != nil {
		// estrategia tolerante:
		// devolvemos igual el detalle base sin romper toda la vista
		return MapTeamDetail(catalog, group, confederation, nil, nil), nil
	}

	squad, err := s.apiClient.GetSquadByTeamID(ctx, externalTeam.Team.ID)
	if err != nil {
		// otra vez tolerante: si falla la plantilla, no rompemos todo
		return MapTeamDetail(catalog, group, confederation, externalTeam, nil), nil
	}

	_ = searchTerm
	return MapTeamDetail(catalog, group, confederation, externalTeam, squad), nil
}

func (s *Service) resolveExternalTeam(ctx context.Context, catalog *TeamCatalogItem) (*apisports.TeamSearchResult, error) {
	resp, err := s.apiClient.GetTeamsBySearch(ctx, catalog.Name)
	if err != nil {
		return nil, err
	}

	if len(resp.Response) == 0 {
		return nil, ErrExternalTeamNotResolved
	}

	// prioridad 1: code exacto
	if catalog.Code != nil {
		for _, candidate := range resp.Response {
			if candidate.Team.Code != nil && strings.EqualFold(*candidate.Team.Code, *catalog.Code) {
				return &candidate, nil
			}
		}
	}

	// prioridad 2: name exacto normalizado
	for _, candidate := range resp.Response {
		if normalize(candidate.Team.Name) == normalize(catalog.Name) {
			return &candidate, nil
		}
	}

	// fallback: primer resultado
	return &resp.Response[0], nil
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
