package main

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
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
	adminSyncToken := mustGetEnv("ADMIN_SYNC_TOKEN")
	allowedEmail := mustGetEnv("ADMIN_SYNC_ALLOWED_EMAIL")

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
		requireAdminAuth(adminSyncToken, supabaseURL, supabaseKey, allowedEmail,
			syncESPNMatchesHandler(espnClient, supabaseURL, supabaseKey),
		),
	)

	log.Printf("backend escuchando en http://localhost:%s", port)

	if err := http.ListenAndServe(":"+port, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

// requireAdminAuth protects a handler with dual-path authorization:
//  1. Static token: Authorization: Bearer <ADMIN_SYNC_TOKEN>  (for curl / Cloud Shell)
//  2. Supabase session: Authorization: Bearer <access_token>  (for frontend admin UI)
//     The Supabase token is verified against the auth API; the returned email must
//     match ADMIN_SYNC_ALLOWED_EMAIL. Unrecognized tokens → 401. Valid token with
//     wrong email → 403.
func requireAdminAuth(staticToken, supabaseURL, supabaseKey, allowedEmail string, next http.HandlerFunc) http.HandlerFunc {
	expected := []byte(staticToken)

	return func(w http.ResponseWriter, r *http.Request) {
		candidate := extractToken(r)

		if candidate == "" {
			writeJSON(w, http.StatusUnauthorized, `{"error":"unauthorized"}`)
			return
		}

		// Fast path: constant-time compare against static admin token.
		if subtle.ConstantTimeCompare([]byte(candidate), expected) == 1 {
			next(w, r)
			return
		}

		// Slow path: treat as a Supabase session token.
		email, err := verifySupabaseToken(r.Context(), supabaseURL, supabaseKey, candidate)
		if err != nil {
			log.Printf("auth: supabase token verification failed: %v", err)
			writeJSON(w, http.StatusUnauthorized, `{"error":"unauthorized"}`)
			return
		}
		if email != allowedEmail {
			log.Printf("auth: forbidden — email %q is not in the allowed list", email)
			writeJSON(w, http.StatusForbidden, `{"error":"forbidden"}`)
			return
		}

		next(w, r)
	}
}

// verifySupabaseToken calls the Supabase Auth API to validate a user access token
// and returns the authenticated user's email.
func verifySupabaseToken(ctx context.Context, supabaseURL, supabaseKey, token string) (string, error) {
	url := supabaseURL + "/auth/v1/user"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("apikey", supabaseKey)
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("supabase auth returned %d", resp.StatusCode)
	}

	var user struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &user); err != nil {
		return "", fmt.Errorf("decoding user: %w", err)
	}
	if user.Email == "" {
		return "", fmt.Errorf("supabase returned empty email")
	}
	return user.Email, nil
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
			writeJSON(w, http.StatusInternalServerError, `{"error":"sync failed"}`)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("encoding sync result: %v", err)
		}
	}
}

func writeJSON(w http.ResponseWriter, status int, body string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write([]byte(body))
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
