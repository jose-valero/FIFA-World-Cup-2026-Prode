package providers

import "context"

type TeamLookupInput struct {
	CompetitionKey string
	EditionKey     string

	InternalTeamID string
	TeamCode       *string
	TeamName       string
	TeamShortName  *string
	ProviderTeamID *string
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

type PlayerLookupInput struct {
	CompetitionKey   string
	EditionKey       string
	InternalTeamID   string
	ProviderTeamID   *string
	ProviderPlayerID string
}

type PlayerSnapshot struct {
	Provider         string
	ProviderPlayerID string

	Name        string
	DisplayName *string
	FirstName   *string
	LastName    *string
	Age         *int
	Number      *int
	Position    *string
	PhotoURL    *string
	BirthPlace  *string
	BirthDate   *string
	Height      *string
	Weight      *string
}

type TeamProvider interface {
	Name() string
	GetTeamSnapshot(ctx context.Context, input TeamLookupInput) (*TeamSnapshot, error)
	GetPlayerSnapshot(ctx context.Context, input PlayerLookupInput) (*PlayerSnapshot, error)
}
