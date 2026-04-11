import type { Match } from '../../matches/types/types';
import type { FixtureViewMode } from '../types/fixture.types';

export function initialFixtureView(matches: Match[]): FixtureViewMode {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');

  if (groupStageMatches.length === 0) {
    const hasKnockoutMatches = matches.some((match) => match.stage !== 'group_stage');
    return hasKnockoutMatches ? 'knockout' : 'group_stage';
  }

  const isGroupStageFinished = groupStageMatches.every((match) => match.status === 'finished');
  return isGroupStageFinished ? 'knockout' : 'group_stage';
}
