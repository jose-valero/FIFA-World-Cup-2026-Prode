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
		FlagCode:  catalog.FlagCode,
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
		detail.Country = catalog.CountryName
		detail.LogoURL = catalog.TeamLogoURL
		detail.National = catalog.IsNational
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

	detail.Country = firstString(catalog.CountryName, snapshot.Country)
	detail.LogoURL = firstString(catalog.TeamLogoURL, snapshot.LogoURL)
	detail.National = firstBool(catalog.IsNational, snapshot.National)

	detail.Founded = snapshot.Founded
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

func firstString(values ...*string) *string {
	for _, value := range values {
		if value != nil && *value != "" {
			return value
		}
	}
	return nil
}

func firstBool(values ...*bool) *bool {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}
