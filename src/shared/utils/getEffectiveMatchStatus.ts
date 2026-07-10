import type { Match, MatchStatus } from '../../modules/matches/types/types';

/**
 * Returns the visual status of a match. The DB status is the only source of
 * truth — it is never inferred from kickoff time, since that produced false
 * 'live'/'finished' labels whenever a sync was delayed or a kickoff date was
 * wrong. Prediction locking is a separate concern (see isMatchLocked), which
 * uses kickoffAt directly as a safety guard regardless of sync status.
 */
export function getEffectiveMatchStatus(match: Pick<Match, 'status'>): MatchStatus {
  return match.status;
}
