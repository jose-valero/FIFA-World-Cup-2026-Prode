import type { Match } from '../../modules/matches/types/types';
import { getEffectiveMatchStatus } from './getEffectiveMatchStatus';

/**
 * Returns the single most relevant match to feature for a participant row:
 *   1. The earliest effectively-live match (started but possibly not yet synced in DB).
 *   2. The next not-yet-started scheduled match.
 *   3. null if no match qualifies.
 *
 * Intentionally returns ONE match so the caller doesn't need slot-grouping logic.
 */
export function selectFeaturedMatch(matches: Match[]): Match | null {
  const live = matches
    .filter((m) => getEffectiveMatchStatus(m) === 'live')
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));

  if (live.length > 0) return live[0];

  const upcoming = matches
    .filter((m) => getEffectiveMatchStatus(m) === 'scheduled')
    .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt));

  return upcoming[0] ?? null;
}
