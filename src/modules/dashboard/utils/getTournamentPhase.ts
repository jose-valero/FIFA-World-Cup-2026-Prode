import type { Match } from '../../matches/types/types';

export function getTournamentPhase(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');
  const knockoutMatches = matches.filter((match) => match.stage !== 'group_stage');

  if (groupStageMatches.length === 0 && knockoutMatches.length > 0) {
    return 'Eliminación';
  }

  const isGroupStageFinished =
    groupStageMatches.length > 0 && groupStageMatches.every((match) => match.status === 'finished');

  return isGroupStageFinished ? 'Eliminación' : 'Grupos';
}
