package providers

import "context"

type TeamLookupInput struct {
	CompetitionKey string
	EditionKey     string

	InternalTeamID string
	TeamCode       *string
	TeamName       string
	TeamShortName  *string
}

type Player struct {
	ProviderPlayerID string
	Name             string
	FirstName        *string
	LastName         *string
	Age              *int
	Number           *int
	Position         *string
	PhotoURL         *string
}

type TeamSnapshot struct {
	Provider       string
	ProviderTeamID *string

	Name     string
	Code     *string
	Country  *string
	LogoURL  *string
	Founded  *int
	National *bool

	VenueName *string
	VenueCity *string

	Players []Player
}

type TeamProvider interface {
	Name() string
	GetTeamSnapshot(ctx context.Context, input TeamLookupInput) (*TeamSnapshot, error)
}
