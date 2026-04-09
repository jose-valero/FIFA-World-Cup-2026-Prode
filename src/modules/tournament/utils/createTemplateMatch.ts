import type { Match } from '../../matches/types/types';
import type { TemplateSource } from '../types/stages.types';

const STAGE_GROUP_LABEL: Record<Exclude<Match['stage'], 'group_stage'>, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  third_place: 'Third place',
  final: 'Final'
};

export function createTemplateMatch(params: {
  id: string;
  stage: Exclude<Match['stage'], 'group_stage'>;
  home: TemplateSource;
  away: TemplateSource;
}): Match {
  const { id, stage, home, away } = params;

  return {
    id,
    stage,
    group: STAGE_GROUP_LABEL[stage],
    groupCode: null,
    homeTeam: '',
    awayTeam: '',
    homeTeamCode: null,
    awayTeamCode: null,
    kickoff: 'Por definir',
    kickoffAt: '2026-06-28T00:00:00Z',
    stadium: 'Por definir',
    city: 'Por definir',
    status: 'scheduled',
    displayOrder: Number(id),
    officialHomeScore: null,
    officialAwayScore: null,

    homeSourceType: home.type,
    homeSourceGroupCode: 'groupCode' in home ? home.groupCode : null,
    homeSourceGroupRank: 'groupRank' in home ? home.groupRank : null,
    homeSourceGroupSet: 'groupSet' in home ? home.groupSet : null,
    homeSourceMatchId: 'matchId' in home ? home.matchId : null,

    awaySourceType: away.type,
    awaySourceGroupCode: 'groupCode' in away ? away.groupCode : null,
    awaySourceGroupRank: 'groupRank' in away ? away.groupRank : null,
    awaySourceGroupSet: 'groupSet' in away ? away.groupSet : null,
    awaySourceMatchId: 'matchId' in away ? away.matchId : null
  };
}
