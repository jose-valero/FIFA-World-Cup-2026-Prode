package teams

import "context"

type Repository interface {
	GetTeamCatalogByID(ctx context.Context, teamID string) (*TeamCatalogItem, error)
	GetWorldCupGroupByTeamCode(ctx context.Context, teamCode string) (*string, error)
}
