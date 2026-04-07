import type { Match } from '../../matches/types/types';

export function isMatchLocked(match: Match, predictionsClosed: boolean) {
  if (predictionsClosed) return true;
  return match.status !== 'scheduled';
}
