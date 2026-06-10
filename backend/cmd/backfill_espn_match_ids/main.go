// backfill_espn_match_ids maps ESPN event IDs to group_stage matches in Supabase.
//
// Runs in dry-run mode by default. Pass --apply to write to the database.
//
// Configuration (resolved in this order for each value):
//
//  1. Explicit CLI flag
//  2. Environment variable
//  3. .env.local file in the working directory (or ENV_FILE / --env-file path)
//
// Usage (from the backend/ directory):
//
//	go run ./cmd/backfill_espn_match_ids             # dry run
//	go run ./cmd/backfill_espn_match_ids --apply     # write to Supabase
//
// Override individual values:
//
//	go run ./cmd/backfill_espn_match_ids --supabase-url=https://... --apply
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"

	"quiniela-backend/internal/espn"
)

const matchWindow = 15 * time.Minute

// cfg holds resolved runtime configuration.
type cfg struct {
	supabaseURL string
	supabaseKey string
	espnBase    string
	apply       bool
}

// dbMatch represents a group_stage match row from Supabase.
type dbMatch struct {
	ID           string  `json:"id"`
	KickoffAt    string  `json:"kickoff_at"`
	HomeTeamCode *string `json:"home_team_code"`
	AwayTeamCode *string `json:"away_team_code"`
	ESPNEventID  *string `json:"espn_event_id"`
}

// matchResult holds the outcome of the matching attempt for one DB match.
type matchResult struct {
	dbMatch    dbMatch
	candidates []espn.Event
}

func main() {
	c := parseConfig()

	ctx := context.Background()
	espnClient := espn.NewClient(c.espnBase)

	log.Printf("Supabase URL : %s", c.supabaseURL)
	log.Printf("ESPN base    : %s", c.espnBase)
	if c.apply {
		log.Printf("Mode         : APPLY — will write to Supabase")
	} else {
		log.Printf("Mode         : DRY RUN — no writes (pass --apply to commit)")
	}

	log.Println()
	log.Printf("fetching group_stage matches from Supabase...")

	matches, err := fetchGroupStageMatches(ctx, c)
	if err != nil {
		log.Fatalf("ERROR: %v", err)
	}
	log.Printf("found %d group_stage match(es) without espn_event_id", len(matches))

	// Collect unique dates to minimize ESPN API calls.
	// We also include the previous calendar day because ESPN organizes scoreboards
	// by the local date of the venue (Americas, UTC-4 to UTC-6). A match at
	// 02:00 UTC on June 12 is June 11 in local time and appears in ESPN's June 11
	// scoreboard — not June 12. Adding date-1 covers all such early-UTC kickoffs
	// without relaxing the matching criteria (codes + time window stay strict).
	dateEvents := map[string][]espn.Event{}
	for _, m := range matches {
		t, err := parseTime(m.KickoffAt)
		if err != nil {
			log.Printf("SKIP  %s — cannot parse kickoff_at %q: %v", m.ID, m.KickoffAt, err)
			continue
		}
		dateEvents[t.UTC().Format("20060102")] = nil
		dateEvents[t.UTC().AddDate(0, 0, -1).Format("20060102")] = nil
	}

	log.Printf("fetching ESPN scoreboards for %d unique date(s)...", len(dateEvents))
	for date := range dateEvents {
		events, err := espnClient.GetScoreboard(ctx, date)
		if err != nil {
			log.Printf("WARN  ESPN scoreboard for %s: %s", date, classifyNetErr(err))
			continue
		}
		dateEvents[date] = events
		log.Printf("  %s → %d event(s)", date, len(events))
	}

	// Match each DB row against ESPN events.
	var resolved, unresolved, conflicts, skipped []matchResult

	for _, m := range matches {
		t, err := parseTime(m.KickoffAt)
		if err != nil {
			skipped = append(skipped, matchResult{dbMatch: m})
			continue
		}

		homeCode := strings.ToUpper(strVal(m.HomeTeamCode))
		awayCode := strings.ToUpper(strVal(m.AwayTeamCode))
		if homeCode == "" || awayCode == "" {
			log.Printf("SKIP  %s — missing team code in DB", m.ID)
			skipped = append(skipped, matchResult{dbMatch: m})
			continue
		}

		// Combine events from the UTC date and the previous day to cover
		// matches that ESPN indexes under the local (Americas) date.
		utcDate := t.UTC().Format("20060102")
		prevDate := t.UTC().AddDate(0, 0, -1).Format("20060102")
		events := append(dateEvents[utcDate], dateEvents[prevDate]...)
		var candidates []espn.Event

		for _, ev := range events {
			evTime, err := ev.KickoffTime()
			if err != nil {
				continue
			}
			diff := evTime.Sub(t)
			if diff < 0 {
				diff = -diff
			}
			if diff > matchWindow {
				continue
			}
			if strings.ToUpper(ev.HomeAbbrev()) != homeCode {
				continue
			}
			if strings.ToUpper(ev.AwayAbbrev()) != awayCode {
				continue
			}
			candidates = append(candidates, ev)
		}

		r := matchResult{dbMatch: m, candidates: candidates}
		switch len(candidates) {
		case 1:
			resolved = append(resolved, r)
		case 0:
			unresolved = append(unresolved, r)
		default:
			conflicts = append(conflicts, r)
		}
	}

	// Report.
	fmt.Println()
	fmt.Println("══════════════════════════════════════════════")
	fmt.Println(" ESPN BACKFILL REPORT")
	fmt.Println("══════════════════════════════════════════════")

	if len(resolved) > 0 {
		fmt.Printf("\nRESOLVED (%d) — will be %s:\n", len(resolved), modeLabel(c.apply))
		for _, r := range resolved {
			ev := r.candidates[0]
			fmt.Printf("  ✓  %-36s  [%s vs %s  %s]  →  espn_event_id=%s\n",
				r.dbMatch.ID,
				strVal(r.dbMatch.HomeTeamCode), strVal(r.dbMatch.AwayTeamCode),
				r.dbMatch.KickoffAt,
				ev.ID,
			)
		}
	}

	if len(unresolved) > 0 {
		fmt.Printf("\nUNRESOLVED (%d) — no ESPN event matched:\n", len(unresolved))
		for _, r := range unresolved {
			fmt.Printf("  ?  %-36s  [%s vs %s  %s]\n",
				r.dbMatch.ID,
				strVal(r.dbMatch.HomeTeamCode), strVal(r.dbMatch.AwayTeamCode),
				r.dbMatch.KickoffAt,
			)
		}
		fmt.Println("  → check that ESPN abbreviations match DB team codes, or widen the time window")
	}

	if len(conflicts) > 0 {
		fmt.Printf("\nCONFLICTS (%d) — multiple ESPN events matched (not safe to write):\n", len(conflicts))
		for _, r := range conflicts {
			fmt.Printf("  !  %-36s  [%s vs %s  %s]  — %d candidates:\n",
				r.dbMatch.ID,
				strVal(r.dbMatch.HomeTeamCode), strVal(r.dbMatch.AwayTeamCode),
				r.dbMatch.KickoffAt,
				len(r.candidates),
			)
			for _, ev := range r.candidates {
				fmt.Printf("       espn_id=%-10s  home=%-4s  away=%s\n", ev.ID, ev.HomeAbbrev(), ev.AwayAbbrev())
			}
		}
	}

	if len(skipped) > 0 {
		fmt.Printf("\nSKIPPED (%d) — missing or unparseable data:\n", len(skipped))
		for _, r := range skipped {
			fmt.Printf("  -  %s\n", r.dbMatch.ID)
		}
	}

	fmt.Printf("\nSummary: %d resolved / %d unresolved / %d conflicts / %d skipped\n",
		len(resolved), len(unresolved), len(conflicts), len(skipped))

	if !c.apply {
		fmt.Println("\nDRY RUN complete — no changes written.")
		fmt.Println("Run with --apply to write espn_event_id to Supabase.")
		return
	}

	if len(resolved) == 0 {
		fmt.Println("\nNothing to write.")
		return
	}

	fmt.Println("\nApplying updates...")
	var written, failed int
	for _, r := range resolved {
		ev := r.candidates[0]
		if err := updateESPNEventID(ctx, c, r.dbMatch.ID, ev.ID); err != nil {
			log.Printf("FAIL  %s: %v", r.dbMatch.ID, err)
			failed++
		} else {
			fmt.Printf("  wrote  espn_event_id=%-10s  → match %s\n", ev.ID, r.dbMatch.ID)
			written++
		}
	}
	fmt.Printf("\nDone: %d written / %d failed.\n", written, failed)
}

// parseConfig resolves configuration from flags → env vars → .env.local file.
// Prints all missing required values at once before exiting.
func parseConfig() cfg {
	fSupabaseURL := flag.String("supabase-url", "", "Supabase REST base URL  (env: SUPABASE_URL)")
	fSupabaseKey := flag.String("supabase-key", "", "Supabase service role key  (env: SUPABASE_SERVICE_ROLE_KEY)")
	fESPNBase := flag.String("espn-base", "", "ESPN site API base URL  (env: ESPN_SITE_API_BASE)")
	fEnvFile := flag.String("env-file", "", "Path to env file  (default: .env.local, or ENV_FILE env var)")
	fApply := flag.Bool("apply", false, "Write changes to Supabase (default: dry run)")
	flag.Parse()

	// Load env file so env vars are available; godotenv never overwrites existing env vars.
	loadEnvFile(coalesce(*fEnvFile, os.Getenv("ENV_FILE"), ".env.local"))

	// Resolve: explicit flag → env var.
	c := cfg{
		apply:       *fApply,
		supabaseURL: coalesce(*fSupabaseURL, os.Getenv("SUPABASE_URL")),
		supabaseKey: coalesce(*fSupabaseKey, os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
		espnBase:    coalesce(*fESPNBase, os.Getenv("ESPN_SITE_API_BASE")),
	}

	// Validate all required values at once.
	var missing []string
	if c.supabaseURL == "" {
		missing = append(missing, "  SUPABASE_URL            (flag: --supabase-url)")
	}
	if c.supabaseKey == "" {
		missing = append(missing, "  SUPABASE_SERVICE_ROLE_KEY  (flag: --supabase-key)")
	}
	if c.espnBase == "" {
		missing = append(missing, "  ESPN_SITE_API_BASE      (flag: --espn-base)")
	}
	if len(missing) > 0 {
		fmt.Fprintln(os.Stderr, "ERROR: missing required configuration:")
		for _, m := range missing {
			fmt.Fprintln(os.Stderr, m)
		}
		fmt.Fprintln(os.Stderr, "\nSet these in .env.local, as environment variables, or via CLI flags.")
		fmt.Fprintln(os.Stderr, "Run with --help to see all available flags.")
		os.Exit(1)
	}

	return c
}

// loadEnvFile loads an env file if it exists, silently skipping if it doesn't.
func loadEnvFile(path string) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return
	}
	if err := godotenv.Load(path); err != nil {
		log.Printf("warning: could not load %s: %v", path, err)
	}
}

// fetchGroupStageMatches returns group_stage matches where espn_event_id IS NULL.
func fetchGroupStageMatches(ctx context.Context, c cfg) ([]dbMatch, error) {
	url := c.supabaseURL + "/rest/v1/matches?select=id,kickoff_at,home_team_code,away_team_code,espn_event_id&stage=eq.group_stage&espn_event_id=is.null&order=kickoff_at.asc"

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("building request: %w", err)
	}
	req.Header.Set("apikey", c.supabaseKey)
	req.Header.Set("Authorization", "Bearer "+c.supabaseKey)
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("GET %s — %s", url, classifyNetErr(err))
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading Supabase response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Supabase returned HTTP %d:\n  URL: %s\n  Body: %s", resp.StatusCode, url, body)
	}

	var rows []dbMatch
	if err := json.Unmarshal(body, &rows); err != nil {
		return nil, fmt.Errorf("decoding Supabase response: %w", err)
	}
	return rows, nil
}

// updateESPNEventID sets espn_event_id for a single match via Supabase REST PATCH.
func updateESPNEventID(ctx context.Context, c cfg, matchID, espnID string) error {
	url := c.supabaseURL + "/rest/v1/matches?id=eq." + matchID

	payload, _ := json.Marshal(map[string]string{"espn_event_id": espnID})

	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("building PATCH request: %w", err)
	}
	req.Header.Set("apikey", c.supabaseKey)
	req.Header.Set("Authorization", "Bearer "+c.supabaseKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Prefer", "return=minimal")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("PATCH %s — %s", url, classifyNetErr(err))
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Supabase PATCH returned HTTP %d: %s", resp.StatusCode, body)
	}
	return nil
}

// classifyNetErr returns a human-readable message for common network errors.
func classifyNetErr(err error) string {
	var dnsErr *net.DNSError
	if errors.As(err, &dnsErr) {
		if dnsErr.IsNotFound || dnsErr.IsTimeout {
			return fmt.Sprintf(
				"DNS lookup failed for %q\n"+
					"  → check your internet connection\n"+
					"  → verify the host in SUPABASE_URL or ESPN_SITE_API_BASE is correct",
				dnsErr.Name,
			)
		}
		return fmt.Sprintf("DNS error for %q: %v", dnsErr.Name, dnsErr)
	}

	var opErr *net.OpError
	if errors.As(err, &opErr) {
		if opErr.Op == "dial" {
			return fmt.Sprintf("cannot connect to %v: %v\n  → check that the host is reachable", opErr.Addr, opErr.Err)
		}
		if opErr.Timeout() {
			return fmt.Sprintf("connection timed out reaching %v", opErr.Addr)
		}
	}

	return err.Error()
}

// coalesce returns the first non-empty string.
func coalesce(vals ...string) string {
	for _, v := range vals {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func parseTime(s string) (time.Time, error) {
	for _, f := range []string{time.RFC3339, "2006-01-02T15:04:05Z", "2006-01-02T15:04Z"} {
		if t, err := time.Parse(f, s); err == nil {
			return t.UTC(), nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time %q", s)
}

func modeLabel(apply bool) string {
	if apply {
		return "WRITTEN"
	}
	return "written on --apply"
}
