package main

import (
	"bytes"
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
	"quiniela-backend/internal/matchdetail"
	matchsync "quiniela-backend/internal/sync"
)

// ctxKey is a private type for context values set by this package.
type ctxKey string

const authSourceCtxKey ctxKey = "auth_source"

func main() {
	loadEnv()

	supabaseURL := mustGetEnv("SUPABASE_URL")
	supabaseKey := mustGetEnv("SUPABASE_SERVICE_ROLE_KEY")
	espnSiteBase := mustGetEnv("ESPN_SITE_API_BASE")
	espnCoreBase := mustGetEnv("ESPN_CORE_API_BASE")
	adminSyncToken := mustGetEnv("ADMIN_SYNC_TOKEN")
	allowedEmail := mustGetEnv("ADMIN_SYNC_ALLOWED_EMAIL")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	espnClient := espn.NewClient(espnSiteBase, espnCoreBase)

	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})

	mux.HandleFunc("GET /api/v1/matches/{matchId}/detail",
		matchDetailHandler(espnClient, supabaseURL, supabaseKey),
	)

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
//
// It also records the auth source in the request context for downstream use.
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
			ctx := context.WithValue(r.Context(), authSourceCtxKey, "manual_token")
			next(w, r.WithContext(ctx))
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

		ctx := context.WithValue(r.Context(), authSourceCtxKey, "manual_ui")
		next(w, r.WithContext(ctx))
	}
}

func syncESPNMatchesHandler(espnClient *espn.Client, supabaseURL, supabaseKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Determine trigger source: query param takes precedence (used by Cloud Scheduler URL),
		// then the auth method recorded by requireAdminAuth.
		source := r.URL.Query().Get("source")
		if source == "" {
			if s, ok := r.Context().Value(authSourceCtxKey).(string); ok {
				source = s
			} else {
				source = "unknown"
			}
		}

		opts := matchsync.Options{Source: source}
		result, err := matchsync.ESPNMatches(r.Context(), espnClient, supabaseURL, supabaseKey, opts)

		if err != nil {
			log.Printf("sync error source=%s err=%v", source, err)
			insertSyncLogError(context.Background(), supabaseURL, supabaseKey, source, err.Error())
			writeJSON(w, http.StatusInternalServerError, `{"error":"sync failed"}`)
			return
		}

		log.Printf("sync ok source=%s reviewed=%d updated=%d unchanged=%d omitted=%d duration_ms=%d",
			result.Source, result.TotalReviewed, result.TotalUpdated,
			result.TotalUnchanged, result.TotalOmitted, result.DurationMs,
		)

		insertSyncLogSuccess(context.Background(), supabaseURL, supabaseKey, result)

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(result); err != nil {
			log.Printf("encoding sync result: %v", err)
		}
	}
}

func matchDetailHandler(espnClient *espn.Client, supabaseURL, supabaseKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		matchID := r.PathValue("matchId")
		if matchID == "" {
			writeJSON(w, http.StatusBadRequest, `{"error":"matchId required"}`)
			return
		}

		detail, err := matchdetail.Fetch(r.Context(), supabaseURL, supabaseKey, espnClient, matchID)
		if err != nil {
			if err == matchdetail.ErrNotFound {
				writeJSON(w, http.StatusNotFound, `{"error":"match not found"}`)
				return
			}
			log.Printf("match detail error matchId=%s err=%v", matchID, err)
			writeJSON(w, http.StatusInternalServerError, `{"error":"internal error"}`)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(detail); err != nil {
			log.Printf("encoding match detail: %v", err)
		}
	}
}

// syncLogPayload is the row we insert into public.sync_logs.
type syncLogPayload struct {
	TriggerSource  string  `json:"trigger_source"`
	TotalReviewed  int     `json:"total_reviewed"`
	TotalUpdated   int     `json:"total_updated"`
	TotalUnchanged int     `json:"total_unchanged"`
	TotalOmitted   int     `json:"total_omitted"`
	DurationMs     int64   `json:"duration_ms"`
	Status         string  `json:"status"`
	ErrorMessage   *string `json:"error_message"`
}

func insertSyncLogSuccess(ctx context.Context, supabaseURL, key string, r *matchsync.Result) {
	p := syncLogPayload{
		TriggerSource:  r.Source,
		TotalReviewed:  r.TotalReviewed,
		TotalUpdated:   r.TotalUpdated,
		TotalUnchanged: r.TotalUnchanged,
		TotalOmitted:   r.TotalOmitted,
		DurationMs:     r.DurationMs,
		Status:         "success",
	}
	if err := insertSyncLog(ctx, supabaseURL, key, p); err != nil {
		log.Printf("sync_logs insert failed: %v", err)
	}
}

func insertSyncLogError(ctx context.Context, supabaseURL, key, source, errMsg string) {
	msg := errMsg
	p := syncLogPayload{
		TriggerSource: source,
		Status:        "error",
		ErrorMessage:  &msg,
	}
	if err := insertSyncLog(ctx, supabaseURL, key, p); err != nil {
		log.Printf("sync_logs insert failed: %v", err)
	}
}

func insertSyncLog(ctx context.Context, supabaseURL, key string, p syncLogPayload) error {
	url := supabaseURL + "/rest/v1/sync_logs"

	body, err := json.Marshal(p)
	if err != nil {
		return fmt.Errorf("marshaling sync log: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("apikey", key)
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("POST sync_logs: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("sync_logs returned HTTP %d: %s", resp.StatusCode, b)
	}
	return nil
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
