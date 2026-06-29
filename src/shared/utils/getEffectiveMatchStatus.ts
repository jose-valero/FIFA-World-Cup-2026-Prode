import type { Match, MatchStatus } from '../../modules/matches/types/types';

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

/**
 * Returns the real visual status of a match, derived from kickoff time when
 * the admin hasn't updated the DB status yet. This only affects display and
 * sort — the DB status field is never mutated.
 *
 * Rules:
 *   - If DB status is 'live' or 'finished' → trust DB as-is.
 *   - If status is 'scheduled' but kickoff was 3+ hours ago → treat as 'finished'.
 *   - If status is 'scheduled' but kickoff has passed → treat as 'live'.
 *   - Otherwise → 'scheduled' (upcoming match, correct).
 */
export function getEffectiveMatchStatus(match: Pick<Match, 'status' | 'kickoffAt'>): MatchStatus {
  if (match.status !== 'scheduled') return match.status;
  const kickoff = new Date(match.kickoffAt).getTime();
  const now = Date.now();
  if (now >= kickoff + THREE_HOURS_MS) return 'finished';
  if (now >= kickoff) return 'live';
  return 'scheduled';
}
