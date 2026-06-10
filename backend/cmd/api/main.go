package main

import (
	"crypto/subtle"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"

	"quiniela-backend/internal/espn"
	matchsync "quiniela-backend/internal/sync"
)

func main() {
	loadEnv()

	supabaseURL := mustGetEnv("SUPABASE_URL")
	supabaseKey := mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")
	espnBase := mustGetEnv("ESPN_SITE_API_BASE")
	adminToken := mustGetEnv("ADMIN_SYNC_TOKEN")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	espnClient := espn.NewClient(espnBase)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("POST /api/v1/admin/sync-espn-matches",
		requireToken(adminToken, syncESPNMatchesHandler(espnClient, supabaseURL, supabaseKey)),
	)

	log.Printf("backend escuchando en http://localhost:%s", port)

	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

// requireToken returns a handler that checks Authorization: Bearer <token>
// or X-Admin-Token: <token> before calling next.
// Uses constant-time comparison to prevent timing attacks.
func requireToken(token string, next http.HandlerFunc) http.HandlerFunc {
	expected := []byte(token)

	return func(w http.ResponseWriter, r *http.Request) {
		candidate := extractToken(r)
		if subtle.ConstantTimeCompare([]byte(candidate), expected) != 1 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"unauthorized"}`))
			return
		}
		next(w, r)
	}
}

// extractToken reads the bearer token from Authorization or X-Admin-Token headers.
func extractToken(r *http.Request) string {
	if auth := r.Header.Get("Authorization"); auth != "" {
		if after, ok := strings.CutPrefix(auth, "Bearer "); ok {
			return strings.TrimSpace(after)
		}
	}
	return strings.TrimSpace(r.Header.Get("X-Admin-Token"))
}

func syncESPNMatchesHandler(espnClient *espn.Client, supabaseURL, supabaseKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		result, err := matchsync.ESPNMatches(r.Context(), espnClient, supabaseURL, supabaseKey)
		if err != nil {
			log.Printf("sync-espn-matches error: %v", err)
			http.Error(w, `{"error":"sync failed"}`, http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("encoding sync result: %v", err)
		}
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
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Token")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
