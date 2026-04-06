import type { Match } from './types';
import { stageOptions as tournamentStageOptions, type TournamentStage } from '../tournament/stages';

export type StageFilterValue = TournamentStage | '';

export type MatchListFilters = {
  stage: StageFilterValue;
  groupCode: string;
  teamQuery: string;
};

export type StageOption = (typeof tournamentStageOptions)[number];

type FilterableMatchLike = Pick<Match, 'stage' | 'homeTeam' | 'awayTeam' | 'homeTeamCode' | 'awayTeamCode'> & {
  groupCode?: string | null;
  group_code?: string | null;
};

export function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function getUniqueStageOptions<T extends { stage: TournamentStage }>(items: T[]): StageOption[] {
  const usedStages = new Set<TournamentStage>(items.map((item) => item.stage));

  return tournamentStageOptions.filter((option) => usedStages.has(option.value));
}

export function getUniqueGroupOptions<T extends { groupCode?: string | null; group_code?: string | null }>(items: T[]) {
  return [...new Set(items.map((item) => item.groupCode ?? item.group_code ?? '').filter(Boolean))].sort();
}

export function matchTeamQuery(
  match: Pick<Match, 'homeTeam' | 'awayTeam' | 'homeTeamCode' | 'awayTeamCode'>,
  query: string
) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return true;
  }

  const haystack = normalizeText(
    [match.homeTeam, match.awayTeam, match.homeTeamCode, match.awayTeamCode].filter(Boolean).join(' ')
  );

  return haystack.includes(normalizedQuery);
}

export function filterMatches<T extends FilterableMatchLike>(items: T[], filters: MatchListFilters) {
  return items.filter((item) => {
    const itemGroupCode = item.groupCode ?? item.group_code ?? '';

    const matchesStage = !filters.stage || item.stage === filters.stage;
    const matchesGroup = !filters.groupCode || itemGroupCode === filters.groupCode;
    const matchesTeam = matchTeamQuery(item, filters.teamQuery);

    return matchesStage && matchesGroup && matchesTeam;
  });
}
