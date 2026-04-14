package teams

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	"quiniela-backend/internal/providers"
)

var ErrTeamNotFound = errors.New("team not found")

type cachedTeamDetail struct {
	detail    *TeamDetail
	expiresAt time.Time
}

type Service struct {
	repo     Repository
	provider providers.TeamProvider

	cacheMu     sync.RWMutex
	detailCache map[string]cachedTeamDetail
	cacheTTL    time.Duration
}

func NewService(repo Repository, provider providers.TeamProvider) *Service {
	return &Service{
		repo:        repo,
		provider:    provider,
		detailCache: make(map[string]cachedTeamDetail),
		cacheTTL:    10 * time.Minute,
	}
}

func (s *Service) GetTeamDetail(ctx context.Context, teamID string) (*TeamDetail, error) {
	if cached, ok := s.getCachedDetail(teamID); ok {
		log.Printf("teams detail cache hit: teamID=%s provider=%s", teamID, s.provider.Name())
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

	log.Printf("team detail request: teamID=%s name=%s code=%v provider=%s", catalog.ID, catalog.Name, catalog.Code, s.provider.Name())

	var group *string
	if catalog.Code != nil {
		group, _ = s.repo.GetWorldCupGroupByTeamCode(ctx, *catalog.Code)
	}

	confederation := ResolveConfederation(catalog.Code)

	snapshot, err := s.provider.GetTeamSnapshot(ctx, providers.TeamLookupInput{
		CompetitionKey: "world_cup",
		EditionKey:     "2026",
		InternalTeamID: catalog.ID,
		TeamCode:       catalog.Code,
		TeamName:       catalog.Name,
		TeamShortName:  catalog.ShortName,
	})
	if err != nil {
		log.Printf("provider snapshot failed: teamID=%s name=%s code=%v provider=%s err=%v", catalog.ID, catalog.Name, catalog.Code, s.provider.Name(), err)

		detail := MapTeamDetailFromSnapshot(catalog, group, confederation, s.provider.Name(), nil)
		return detail, nil
	}

	playerCount := len(snapshot.Players)
	log.Printf(
		"provider snapshot loaded: teamID=%s provider=%s providerTeamID=%v players=%d",
		catalog.ID,
		s.provider.Name(),
		snapshot.ProviderTeamID,
		playerCount,
	)

	detail := MapTeamDetailFromSnapshot(catalog, group, confederation, s.provider.Name(), snapshot)
	s.storeCachedDetail(teamID, detail)

	return detail, nil
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
