import type { Match } from '../matches/types';

export function isGroupFinished(groupCode: string, matches: Match[]) {
  const groupMatches = matches.filter((match) => match.stage === 'group_stage' && match.groupCode === groupCode);

  if (groupMatches.length === 0) return false;

  return groupMatches.every((match) => match.status === 'finished');
}
