import type { TournamentStage } from '../../tournament/utils/stages';

export type MatchStatus = 'scheduled' | 'live' | 'finished';
export type MatchSourceType = 'team_id' | 'group_position' | 'best_third_place' | 'match_winner' | 'match_loser';

export interface Match {
  id: string;
  stage: TournamentStage;
  group: string;
  groupCode: string | null;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  kickoff: string;
  kickoffAt: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  displayOrder: number | null;
  officialHomeScore: number | null;
  officialAwayScore: number | null;

  homeSourceType: MatchSourceType | null;
  homeSourceGroupCode: string | null;
  homeSourceGroupRank: number | null;
  homeSourceGroupSet: string | null;
  homeSourceMatchId: string | null;

  awaySourceType: MatchSourceType | null;
  awaySourceGroupCode: string | null;
  awaySourceGroupRank: number | null;
  awaySourceGroupSet: string | null;
  awaySourceMatchId: string | null;
}
