package main

import (
	"log"
	"net/http"
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	repo := teams.NewSupabaseRepository(supabaseURL, supabaseServiceRoleKey)
	teamProvider := buildTeamProvider()

	service := teams.NewService(repo, teamProvider)
	handler := teams.NewHandler(service)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("GET /api/v1/teams/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if strings.Contains(path, "/players/") && strings.HasSuffix(path, "/detail") {
			handler.GetPlayerDetail(w, r)
			return
		}

		handler.GetTeamDetail(w, r)
	})

	log.Printf("backend escuchando en http://localhost:%s", port)
	log.Printf("team provider activo: %s", teamProvider.Name())

	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func buildTeamProvider() providers.TeamProvider {
	providerName := strings.TrimSpace(strings.ToLower(mustGetEnv("TEAM_PROVIDER")))

	switch providerName {
	case "espn":
		espnBaseURL := mustGetEnv("ESPN_SITE_API_BASE")
		espnClient := providerespn.NewClient(espnBaseURL)
		return providerespn.NewTeamProvider(espnClient)

	default:
		log.Fatalf("unsupported TEAM_PROVIDER: %s", providerName)
		return nil
	}
}

func loadEnv() {
	envFile := os.Getenv("ENV_FILE")
	if envFile == "" {
		envFile = ".env.local"
	}

	if err := godotenv.Load(envFile); err != nil {
		log.Printf("warning: could not load env file %s: %v", envFile, err)
	}
}

func mustGetEnv(key string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		log.Fatalf("missing required env: %s", key)
	}
	return value
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := os.Getenv("FRONTEND_ORIGIN")
		if origin == "" {
			origin = "http://localhost:5173"
		}

		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
