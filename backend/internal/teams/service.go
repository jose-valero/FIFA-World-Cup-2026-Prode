package teams

import (
	"context"
	"errors"
	"log"
	"strings"
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
		ProviderTeamID: catalog.EspnTeamID,
	})
	if err != nil {
		log.Printf(
			"provider snapshot failed: teamID=%s name=%s code=%v provider=%s err=%v",
			catalog.ID,
			catalog.Name,
			catalog.Code,
			s.provider.Name(),
			err,
		)

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

	s.tryPersistProviderMapping(ctx, catalog, snapshot)

	detail := MapTeamDetailFromSnapshot(catalog, group, confederation, s.provider.Name(), snapshot)
	s.storeCachedDetail(teamID, detail)

	return detail, nil
}

func (s *Service) tryPersistProviderMapping(ctx context.Context, catalog *TeamCatalogItem, snapshot *providers.TeamSnapshot) {
	if s.provider.Name() != "espn" {
		return
	}

	if snapshot == nil || snapshot.ProviderTeamID == nil || strings.TrimSpace(*snapshot.ProviderTeamID) == "" {
		return
	}

	if catalog.EspnTeamID != nil && strings.TrimSpace(*catalog.EspnTeamID) != "" {
		return
	}

	espnTeamID := strings.TrimSpace(*snapshot.ProviderTeamID)

	if err := s.repo.SaveEspnTeamID(ctx, catalog.ID, espnTeamID); err != nil {
		log.Printf("failed to persist espn_team_id: teamID=%s espnTeamID=%s err=%v", catalog.ID, espnTeamID, err)
		return
	}

	log.Printf("persisted espn_team_id: teamID=%s espnTeamID=%s", catalog.ID, espnTeamID)
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
