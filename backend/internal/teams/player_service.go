package teams

import (
	"context"
	"errors"
	"log"

	"quiniela-backend/internal/providers"
)

var ErrPlayerNotFound = errors.New("player not found")

func (s *Service) GetPlayerDetail(ctx context.Context, teamID string, playerID string) (*TeamPlayerDetail, error) {
	teamDetail, err := s.GetTeamDetail(ctx, teamID)
	if err != nil {
		return nil, err
	}
	if teamDetail == nil {
		return nil, ErrTeamNotFound
	}

	var basePlayer *TeamPlayer
	for i := range teamDetail.Players {
		if teamDetail.Players[i].ID == playerID {
			basePlayer = &teamDetail.Players[i]
			break
		}
	}

	if basePlayer == nil {
		return nil, ErrPlayerNotFound
	}

	result := &TeamPlayerDetail{
		ID:          basePlayer.ID,
		Name:        basePlayer.Name,
		DisplayName: stringPtr(basePlayer.Name),
		FirstName:   basePlayer.FirstName,
		LastName:    basePlayer.LastName,
		Age:         basePlayer.Age,
		Number:      basePlayer.Number,
		Position:    basePlayer.Position,
		PhotoURL:    basePlayer.PhotoURL,
		BirthPlace:  nil,
		BirthDate:   nil,
		Height:      nil,
		Weight:      nil,
		Provider:    teamDetail.Source.Provider,
	}

	catalog, err := s.repo.GetTeamCatalogByID(ctx, teamID)
	if err != nil {
		log.Printf("player detail: failed to load catalog, returning base player detail: teamID=%s playerID=%s err=%v", teamID, playerID, err)
		return result, nil
	}
	if catalog == nil {
		return result, nil
	}

	snapshot, err := s.provider.GetPlayerSnapshot(ctx, providers.PlayerLookupInput{
		CompetitionKey:   "world_cup",
		EditionKey:       "2026",
		InternalTeamID:   catalog.ID,
		ProviderTeamID:   catalog.EspnTeamID,
		ProviderPlayerID: playerID,
	})
	if err != nil {
		log.Printf("player enrichment failed, returning base player detail: teamID=%s playerID=%s provider=%s err=%v", teamID, playerID, s.provider.Name(), err)
		return result, nil
	}

	if snapshot == nil {
		return result, nil
	}

	mergePlayerDetail(result, snapshot)

	return result, nil
}

func mergePlayerDetail(target *TeamPlayerDetail, snapshot *providers.PlayerSnapshot) {
	if target == nil || snapshot == nil {
		return
	}

	if snapshot.Name != "" {
		target.Name = snapshot.Name
	}
	if snapshot.DisplayName != nil {
		target.DisplayName = snapshot.DisplayName
	}
	if snapshot.FirstName != nil {
		target.FirstName = snapshot.FirstName
	}
	if snapshot.LastName != nil {
		target.LastName = snapshot.LastName
	}
	if snapshot.Age != nil {
		target.Age = snapshot.Age
	}
	if snapshot.Number != nil {
		target.Number = snapshot.Number
	}
	if snapshot.Position != nil {
		target.Position = snapshot.Position
	}
	if snapshot.PhotoURL != nil {
		target.PhotoURL = snapshot.PhotoURL
	}
	if snapshot.BirthPlace != nil {
		target.BirthPlace = snapshot.BirthPlace
	}
	if snapshot.BirthDate != nil {
		target.BirthDate = snapshot.BirthDate
	}
	if snapshot.Height != nil {
		target.Height = snapshot.Height
	}
	if snapshot.Weight != nil {
		target.Weight = snapshot.Weight
	}
	if snapshot.Provider != "" {
		target.Provider = snapshot.Provider
	}
}

func stringPtr(value string) *string {
	return &value
}
