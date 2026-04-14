package teams

import (
	"strconv"
	"time"

	"quiniela-backend/internal/providers"
)

func MapTeamDetailFromSnapshot(
	catalog *TeamCatalogItem,
	group *string,
	confederation TeamConfederation,
	providerName string,
	snapshot *providers.TeamSnapshot,
) *TeamDetail {
	detail := &TeamDetail{
		ID:        catalog.ID,
		Code:      catalog.Code,
		Name:      catalog.Name,
		ShortName: catalog.ShortName,
		Group:     group,
		Confederation: TeamConfederation{
			Code:  confederation.Code,
			Label: confederation.Label,
		},
		Players: []TeamPlayer{},
		Source: TeamDetailSource{
			Provider:  providerName,
			FetchedAt: time.Now().UTC(),
		},
	}

	if snapshot == nil {
		return detail
	}

	if snapshot.Provider != "" {
		detail.Source.Provider = snapshot.Provider
	}

	if snapshot.ProviderTeamID != nil {
		if parsedID, err := strconv.Atoi(*snapshot.ProviderTeamID); err == nil {
			detail.Source.ExternalTeamID = &parsedID
		}
	}

	detail.Country = snapshot.Country
	detail.LogoURL = snapshot.LogoURL
	detail.Founded = snapshot.Founded
	detail.National = snapshot.National
	detail.Venue = TeamVenue{
		Name: snapshot.VenueName,
		City: snapshot.VenueCity,
	}

	for _, player := range snapshot.Players {
		detail.Players = append(detail.Players, TeamPlayer{
			ID:        player.ProviderPlayerID,
			Name:      player.Name,
			FirstName: player.FirstName,
			LastName:  player.LastName,
			Age:       player.Age,
			Number:    player.Number,
			Position:  player.Position,
			PhotoURL:  player.PhotoURL,
		})
	}

	return detail
}
