package main

import (
	"context"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"

	"quiniela-backend/internal/providers"
	providerespn "quiniela-backend/internal/providers/espn"
	"quiniela-backend/internal/teams"
)

func main() {
	loadEnv()

	supabaseURL := mustGetEnv("SUPABASE_URL")
	supabaseServiceRoleKey := mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")
	espnBaseURL := mustGetEnv("ESPN_SITE_API_BASE")

	repo := teams.NewSupabaseRepository(supabaseURL, supabaseServiceRoleKey)
	provider := providerespn.NewTeamProvider(providerespn.NewClient(espnBaseURL))

	ctx := context.Background()

	items, err := repo.ListTeamsWithoutEspnMapping(ctx)
	if err != nil {
		log.Fatalf("list teams without espn mapping failed: %v", err)
	}

	log.Printf("teams without espn mapping: %d", len(items))

	for _, item := range items {
		log.Printf("resolving espn_team_id: teamID=%s name=%s code=%v", item.ID, item.Name, item.Code)

		snapshot, err := provider.GetTeamSnapshot(ctx, providers.TeamLookupInput{
			CompetitionKey: "world_cup",
			EditionKey:     "2026",
			InternalTeamID: item.ID,
			TeamCode:       item.Code,
			TeamName:       item.Name,
			TeamShortName:  item.ShortName,
			ProviderTeamID: item.EspnTeamID,
		})
		if err != nil {
			log.Printf("failed to resolve team: teamID=%s name=%s err=%v", item.ID, item.Name, err)
			continue
		}

		if snapshot == nil || snapshot.ProviderTeamID == nil || strings.TrimSpace(*snapshot.ProviderTeamID) == "" {
			log.Printf("snapshot has no provider team id: teamID=%s name=%s", item.ID, item.Name)
			continue
		}

		espnTeamID := strings.TrimSpace(*snapshot.ProviderTeamID)

		if err := repo.SaveEspnTeamID(ctx, item.ID, espnTeamID); err != nil {
			log.Printf("failed to save espn_team_id: teamID=%s name=%s espnTeamID=%s err=%v", item.ID, item.Name, espnTeamID, err)
			continue
		}

		log.Printf("saved espn_team_id: teamID=%s name=%s espnTeamID=%s", item.ID, item.Name, espnTeamID)
	}

	log.Printf("backfill finished")
}

func loadEnv() {
	envFile := os.Getenv("ENV_FILE")
	if envFile == "" {
		envFile = ".env.local"
	}

	_ = godotenv.Load(envFile)
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("missing required env: %s", key)
	}
	return value
}
