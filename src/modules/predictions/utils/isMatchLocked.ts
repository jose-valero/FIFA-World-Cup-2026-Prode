import type { Match } from '../../matches/types/types';

export function isMatchLocked(match: Match, predictionsClosed: boolean, groupStageLocked = false) {
  if (predictionsClosed) return true;
  if (groupStageLocked && match.stage === 'group_stage') return true;
  if (match.status !== 'scheduled') return true;
  if (match.stage !== 'group_stage' && (!match.homeTeamId || !match.awayTeamId)) return true;
  return false;
}
