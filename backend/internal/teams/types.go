package teams

import "time"

type TeamCatalogItem struct {
	ID        string
	Code      *string
	Name      string
	ShortName *string
}

type TeamConfederation struct {
	Code  *string `json:"code"`
	Label *string `json:"label"`
}

type TeamVenue struct {
	Name *string `json:"name"`
	City *string `json:"city"`
}

type TeamPlayer struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	FirstName *string `json:"firstName"`
	LastName  *string `json:"lastName"`
	Age       *int    `json:"age"`
	Number    *int    `json:"number"`
	Position  *string `json:"position"`
	PhotoURL  *string `json:"photoUrl"`
}

type TeamDetail struct {
	ID            string            `json:"id"`
	Code          *string           `json:"code"`
	Name          string            `json:"name"`
	ShortName     *string           `json:"shortName"`
	Group         *string           `json:"group"`
	Confederation TeamConfederation `json:"confederation"`
	Country       *string           `json:"country"`
	LogoURL       *string           `json:"logoUrl"`
	Founded       *int              `json:"founded"`
	National      *bool             `json:"national"`
	Venue         TeamVenue         `json:"venue"`
	Players       []TeamPlayer      `json:"players"`
	Source        TeamDetailSource  `json:"source"`
}

type TeamDetailSource struct {
	Provider       string    `json:"provider"`
	ExternalTeamID *int      `json:"externalTeamId"`
	FetchedAt      time.Time `json:"fetchedAt"`
}
