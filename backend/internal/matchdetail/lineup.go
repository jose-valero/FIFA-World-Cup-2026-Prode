package matchdetail

import (
	"context"
	"strconv"
	"sync"
	"time"

	"quiniela-backend/internal/espn"
)

// ── Lineup response types ─────────────────────────────────────────────────────

// MatchLineups is the top-level lineup payload added to Response.
type MatchLineups struct {
	Available bool        `json:"available"`
	Home      *TeamLineup `json:"home"`
	Away      *TeamLineup `json:"away"`
}

// TeamLineup holds the normalized lineup for one team.
type TeamLineup struct {
	Formation *LineupFormation `json:"formation"`
	Starters  []LineupPlayer   `json:"starters"`
	Bench     []LineupPlayer   `json:"bench"`
}

// LineupFormation is the tactical shape info from ESPN.
type LineupFormation struct {
	Summary string `json:"summary"`
	Name    string `json:"name"`
	NumRows int    `json:"numRows"`
}

// LineupPlayer is a single player entry in the lineup.
type LineupPlayer struct {
	PlayerID       string          `json:"playerId"`
	Name           string          `json:"name"`
	ShortName      *string         `json:"shortName"`
	Jersey         *string         `json:"jersey"`
	Position       *LineupPosition `json:"position"`
	Starter        bool            `json:"starter"`
	FormationPlace *int            `json:"formationPlace"`
	Active         bool            `json:"active"`
	SubbedIn       SubStatus       `json:"subbedIn"`
	SubbedOut      SubStatus       `json:"subbedOut"`
}

// LineupPosition is the normalized position of a player.
type LineupPosition struct {
	ID           *string `json:"id"`
	Name         *string `json:"name"`
	Abbreviation *string `json:"abbreviation"`
}

// SubStatus tracks whether a substitution occurred (minute is future work).
type SubStatus struct {
	DidSub bool    `json:"didSub"`
	Minute *string `json:"minute"`
}

// ── Public fetch entry point ──────────────────────────────────────────────────

// fetchLineups builds the full MatchLineups payload from ESPN Core API rosters.
// If lineups are unavailable or any fatal step fails, returns Available=false without error.
func fetchLineups(ctx context.Context, client *espn.Client, espnID string, summary *espn.EventSummary) *MatchLineups {
	if summary == nil || len(summary.Header.Competitions) == 0 {
		return &MatchLineups{Available: false}
	}

	var homeID, awayID string
	for _, c := range summary.Header.Competitions[0].Competitors {
		if c.HomeAway == "home" {
			homeID = c.ID
		} else if c.HomeAway == "away" {
			awayID = c.ID
		}
	}
	if homeID == "" || awayID == "" {
		return &MatchLineups{Available: false}
	}

	// Use a short timeout so lineup fetches never block the main detail response.
	lineupCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()

	var homeLineup, awayLineup *TeamLineup
	var wg sync.WaitGroup
	wg.Add(2)

	go func() {
		defer wg.Done()
		homeLineup = fetchTeamLineup(lineupCtx, client, espnID, homeID)
	}()
	go func() {
		defer wg.Done()
		awayLineup = fetchTeamLineup(lineupCtx, client, espnID, awayID)
	}()
	wg.Wait()

	if homeLineup == nil && awayLineup == nil {
		return &MatchLineups{Available: false}
	}

	return &MatchLineups{
		Available: true,
		Home:      homeLineup,
		Away:      awayLineup,
	}
}

// fetchTeamLineup fetches and normalizes one team's roster from ESPN.
func fetchTeamLineup(ctx context.Context, client *espn.Client, espnID, competitorID string) *TeamLineup {
	roster, err := client.GetRoster(ctx, espnID, competitorID)
	if err != nil || len(roster.Entries) == 0 {
		return nil
	}

	// Resolve all athlete and position refs concurrently (max 10 in flight).
	players := resolveRosterEntries(ctx, client, roster.Entries)

	var starters, bench []LineupPlayer
	for _, p := range players {
		if p.Starter {
			starters = append(starters, p)
		} else {
			bench = append(bench, p)
		}
	}

	var formation *LineupFormation
	if roster.Formation.Summary != "" {
		formation = &LineupFormation{
			Summary: roster.Formation.Summary,
			Name:    roster.Formation.Name,
			NumRows: roster.Formation.NumRows,
		}
	}

	return &TeamLineup{
		Formation: formation,
		Starters:  nullSafeSlice(starters),
		Bench:     nullSafeSlice(bench),
	}
}

// resolveRosterEntries resolves athlete and position $refs concurrently.
func resolveRosterEntries(ctx context.Context, client *espn.Client, entries []espn.RosterEntry) []LineupPlayer {
	sem := make(chan struct{}, 10)
	results := make([]LineupPlayer, len(entries))
	var wg sync.WaitGroup

	for i, entry := range entries {
		wg.Add(1)
		go func(idx int, e espn.RosterEntry) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			results[idx] = resolveEntry(ctx, client, e)
		}(i, entry)
	}

	wg.Wait()
	return results
}

// resolveEntry fetches athlete and position info for a single roster entry.
func resolveEntry(ctx context.Context, client *espn.Client, e espn.RosterEntry) LineupPlayer {
	subbedInMinute := minuteOrNil(e.SubbedIn.Clock.DisplayValue)
	subbedOutMinute := minuteOrNil(e.SubbedOut.Clock.DisplayValue)

	p := LineupPlayer{
		Starter:   e.Starter,
		Active:    e.Active,
		SubbedIn:  SubStatus{DidSub: e.SubbedIn.DidSub, Minute: subbedInMinute},
		SubbedOut: SubStatus{DidSub: e.SubbedOut.DidSub, Minute: subbedOutMinute},
	}

	if e.Jersey != "" {
		j := e.Jersey
		p.Jersey = &j
	}
	if fp, err := strconv.Atoi(e.FormationPlace); err == nil && fp > 0 {
		p.FormationPlace = &fp
	}

	// Resolve athlete ref
	if e.Athlete.Ref != "" {
		athleteID := extractIDFromRef(e.Athlete.Ref)
		p.PlayerID = athleteID

		if info, err := client.GetAthleteInfo(ctx, e.Athlete.Ref); err == nil {
			p.Name = info.DisplayName
			if info.ShortName != "" {
				sn := info.ShortName
				p.ShortName = &sn
			}
			if info.ID != "" {
				p.PlayerID = info.ID
			}
		}
	}

	// Resolve position ref
	if e.Position.Ref != "" {
		if pos, err := client.GetPositionInfo(ctx, e.Position.Ref); err == nil {
			lp := &LineupPosition{}
			if pos.ID != "" {
				id := pos.ID
				lp.ID = &id
			}
			if pos.Name != "" {
				n := pos.Name
				lp.Name = &n
			}
			if pos.Abbreviation != "" {
				a := pos.Abbreviation
				lp.Abbreviation = &a
			}
			p.Position = lp
		}
	}

	return p
}

// extractIDFromRef extracts the numeric ID from an ESPN Core API $ref URL.
// Strips query params and takes the last path segment.
func extractIDFromRef(ref string) string {
	return extractLastPathSegment(ref)
}

func extractLastPathSegment(ref string) string {
	if q := findByte(ref, '?'); q >= 0 {
		ref = ref[:q]
	}
	ref = trimRight(ref, '/')
	i := lastIndex(ref, '/')
	if i < 0 || i == len(ref)-1 {
		return ref
	}
	return ref[i+1:]
}

func findByte(s string, b byte) int {
	for i := 0; i < len(s); i++ {
		if s[i] == b {
			return i
		}
	}
	return -1
}

func trimRight(s string, b byte) string {
	for len(s) > 0 && s[len(s)-1] == b {
		s = s[:len(s)-1]
	}
	return s
}

func lastIndex(s string, b byte) int {
	for i := len(s) - 1; i >= 0; i-- {
		if s[i] == b {
			return i
		}
	}
	return -1
}

func minuteOrNil(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func nullSafeSlice(s []LineupPlayer) []LineupPlayer {
	if s == nil {
		return []LineupPlayer{}
	}
	return s
}
