import type { Match } from '../../matches/types/types';

export function isKnockoutMatchDefined(match: Match): boolean {
  if (match.stage === 'group_stage') return true;
  return Boolean(match.homeTeamId && match.awayTeamId);
}
