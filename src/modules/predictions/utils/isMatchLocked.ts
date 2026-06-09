import type { Match } from '../../matches/types/types';

export function isMatchLocked(match: Match, predictionsClosed: boolean) {
  if (predictionsClosed) return true;
  if (match.status !== 'scheduled') return true;
  if (match.stage !== 'group_stage' && (!match.homeTeamId || !match.awayTeamId)) return true;
  return false;
}
