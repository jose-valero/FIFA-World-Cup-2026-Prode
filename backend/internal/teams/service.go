package teams

import (
	"context"
	"errors"
	"log"
	"strings"
	"sync"
	"time"

	"quiniela-backend/internal/apisports"
)

var ErrTeamNotFound = errors.New("team not found")
var ErrExternalTeamNotResolved = errors.New("external team not resolved")

type cachedTeamDetail struct {
	detail    *TeamDetail
	expiresAt time.Time
}

type Service struct {
	repo      Repository
	apiClient *apisports.Client

	cacheMu     sync.RWMutex
	detailCache map[string]cachedTeamDetail
	cacheTTL    time.Duration
}

func NewService(repo Repository, apiClient *apisports.Client) *Service {
	return &Service{
		repo:        repo,
		apiClient:   apiClient,
		detailCache: make(map[string]cachedTeamDetail),
		cacheTTL:    10 * time.Minute,
	}
}

func (s *Service) GetTeamDetail(ctx context.Context, teamID string) (*TeamDetail, error) {
	if cached, ok := s.getCachedDetail(teamID); ok {
		log.Printf("teams detail cache hit: teamID=%s", teamID)
		return cached, nil
	}

	catalog, err := s.repo.GetTeamCatalogByID(ctx, teamID)
	if err != nil {
		log.Printf("get team catalog failed: teamID=%s err=%v", teamID, err)
		return nil, err
	}
	if catalog == nil {
		log.Printf("team not found in catalog: teamID=%s", teamID)
		return nil, ErrTeamNotFound
	}

	log.Printf("team detail request: teamID=%s name=%s code=%v", catalog.ID, catalog.Name, catalog.Code)

	var group *string
	if catalog.Code != nil {
		group, _ = s.repo.GetWorldCupGroupByTeamCode(ctx, *catalog.Code)
	}

	confederation := ResolveConfederation(catalog.Code)

	externalTeam, err := s.resolveExternalTeam(ctx, catalog)
	if err != nil {
		log.Printf("resolveExternalTeam failed: teamID=%s name=%s code=%v err=%v", catalog.ID, catalog.Name, catalog.Code, err)
		return MapTeamDetail(catalog, group, confederation, nil, nil), nil
	}

	log.Printf(
		"resolved external team: teamID=%s externalTeamID=%d externalName=%s externalCode=%v national=%v",
		catalog.ID,
		externalTeam.Team.ID,
		externalTeam.Team.Name,
		externalTeam.Team.Code,
		externalTeam.Team.National,
	)

	squad, err := s.apiClient.GetSquadByTeamID(ctx, externalTeam.Team.ID)
	if err != nil {
		log.Printf("get squad failed: teamID=%s externalTeamID=%d err=%v", catalog.ID, externalTeam.Team.ID, err)

		detail := MapTeamDetail(catalog, group, confederation, externalTeam, nil)
		s.storeCachedDetail(teamID, detail)
		return detail, nil
	}

	playerCount := 0
	if squad != nil && len(squad.Response) > 0 {
		playerCount = len(squad.Response[0].Players)
	}

	log.Printf("squad loaded: teamID=%s externalTeamID=%d players=%d", catalog.ID, externalTeam.Team.ID, playerCount)

	detail := MapTeamDetail(catalog, group, confederation, externalTeam, squad)
	s.storeCachedDetail(teamID, detail)

	return detail, nil
}

func (s *Service) resolveExternalTeam(ctx context.Context, catalog *TeamCatalogItem) (*apisports.TeamSearchResult, error) {
	resp, err := s.apiClient.GetTeamsBySearch(ctx, catalog.Name)
	if err != nil {
		return nil, err
	}

	if len(resp.Response) == 0 {
		return nil, ErrExternalTeamNotResolved
	}

	best, ok := selectBestExternalTeam(resp.Response, catalog)
	if !ok {
		return nil, ErrExternalTeamNotResolved
	}

	return best, nil
}

func selectBestExternalTeam(candidates []apisports.TeamSearchResult, catalog *TeamCatalogItem) (*apisports.TeamSearchResult, bool) {
	if len(candidates) == 0 {
		return nil, false
	}

	bestIndex := -1
	bestScore := -1

	for i, candidate := range candidates {
		score := scoreExternalTeamCandidate(candidate, catalog)

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

func scoreExternalTeamCandidate(candidate apisports.TeamSearchResult, catalog *TeamCatalogItem) int {
	score := 0

	if catalog.Code != nil && candidate.Team.Code != nil && strings.EqualFold(*catalog.Code, *candidate.Team.Code) {
		score += 100
	}

	if candidate.Team.National != nil && *candidate.Team.National {
		score += 40
	}

	if normalize(candidate.Team.Name) == normalize(catalog.Name) {
		score += 60
	}

	if candidate.Team.Country != nil && normalize(*candidate.Team.Country) == normalize(catalog.Name) {
		score += 20
	}

	if catalog.ShortName != nil && normalize(candidate.Team.Name) == normalize(*catalog.ShortName) {
		score += 20
	}

	return score
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

func (s *Service) getCachedDetail(teamID string) (*TeamDetail, bool) {
	s.cacheMu.RLock()
	defer s.cacheMu.RUnlock()

	entry, ok := s.detailCache[teamID]
	if !ok {
		return nil, false
	}

	if time.Now().After(entry.expiresAt) {
		return nil, false
	}

	return entry.detail, true
}

func (s *Service) storeCachedDetail(teamID string, detail *TeamDetail) {
	if detail == nil || detail.Source.ExternalTeamID == nil {
		return
	}

	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	s.detailCache[teamID] = cachedTeamDetail{
		detail:    detail,
		expiresAt: time.Now().Add(s.cacheTTL),
	}
}
