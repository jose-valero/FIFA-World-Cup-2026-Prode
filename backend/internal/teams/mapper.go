package teams

import (
	"quiniela-backend/internal/apisports"
	"strconv"
	"time"
)

func MapTeamDetail(
	catalog *TeamCatalogItem,
	group *string,
	confederation TeamConfederation,
	teamResult *apisports.TeamSearchResult,
	squad *apisports.SquadResponse,
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
			Provider:  "api-sports",
			FetchedAt: time.Now().UTC(),
		},
	}

	if teamResult != nil {
		detail.Source.ExternalTeamID = &teamResult.Team.ID
		detail.Country = teamResult.Team.Country
		detail.LogoURL = teamResult.Team.Logo
		detail.Founded = teamResult.Team.Founded
		detail.National = teamResult.Team.National
		detail.Venue = TeamVenue{
			Name: teamResult.Venue.Name,
			City: teamResult.Venue.City,
		}
	}

	if squad != nil && len(squad.Response) > 0 {
		for _, p := range squad.Response[0].Players {
			playerID := strconv.Itoa(p.ID)

			detail.Players = append(detail.Players, TeamPlayer{
				ID:       playerID,
				Name:     p.Name,
				Age:      p.Age,
				Number:   p.Number,
				Position: p.Position,
				PhotoURL: p.Photo,
			})
		}
	}

	return detail
}
