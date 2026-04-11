import type { Match } from '../../matches/types/types';

export function currentPhase(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');

  if (groupStageMatches.length === 0) {
    return 'Torneo cargado';
  }

  const isGroupStageFinished = groupStageMatches.every((match) => match.status === 'finished');

  return isGroupStageFinished ? 'Fase de eliminación' : 'Fase de grupos';
}
