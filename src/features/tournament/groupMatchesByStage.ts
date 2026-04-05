import type { Match } from '../matches/types';
import { stageOrder, type TournamentStage } from './stages';

export interface StageGroup {
  stage: TournamentStage;
  matches: Match[];
}

export function groupMatchesByStage(matches: Match[]): StageGroup[] {
  const grouped = matches.reduce<Record<string, Match[]>>((acc, match) => {
    if (!acc[match.stage]) {
      acc[match.stage] = [];
    }

    acc[match.stage].push(match);
    return acc;
  }, {});

  return stageOrder
    .filter((stage) => grouped[stage]?.length)
    .map((stage) => ({
      stage,
      matches: grouped[stage]
    }));
}
