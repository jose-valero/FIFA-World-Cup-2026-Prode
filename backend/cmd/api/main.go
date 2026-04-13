package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"quiniela-backend/internal/apisports"
	"quiniela-backend/internal/teams"
)

func main() {
	loadEnv()

	apiSportsBaseURL := mustGetEnv("API_SPORTS_BASE_URL")
	apiSportsKey := mustGetEnv("API_SPORTS_KEY")

	supabaseURL := mustGetEnv("SUPABASE_URL")
	supabaseServiceRoleKey := mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	apiSportsClient := apisports.NewClient(apiSportsBaseURL, apiSportsKey)
	repo := teams.NewSupabaseRepository(supabaseURL, supabaseServiceRoleKey)

	service := teams.NewService(repo, apiSportsClient)
	handler := teams.NewHandler(service)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("GET /api/v1/teams/", handler.GetTeamDetail)

	log.Printf("backend escuchando en http://localhost:%s", port)

	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}

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
