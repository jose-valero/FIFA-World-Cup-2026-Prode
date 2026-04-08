import type { MatchStatus } from '../../../matches/types/types';
import type { TournamentStage } from '../../../tournament/utils/stages';

export interface AdminMatchRow {
  id: string;
  stage: TournamentStage;
  matchday: number | null;
  group_order: number | null;
  group_name: string;
  home_team: string;
  away_team: string;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff_at: string;
  stadium: string;
  city: string;
  status: MatchStatus;

  official_away_score: number | null;
  official_home_score: number | null;

  home_team_id: string | null;
  home_source_type: 'team' | 'group_position' | 'best_third_place' | 'match_winner' | 'match_loser' | null;
  home_source_group_code: string | null;
  home_source_group_rank: number | null;
  home_source_group_set: string | null;
  home_source_match_id: string | null;

  away_team_id: string | null;
  away_source_type: 'team' | 'group_position' | 'best_third_place' | 'match_winner' | 'match_loser' | null;
  away_source_group_code: string | null;
  away_source_group_rank: number | null;
  away_source_group_set: string | null;
  away_source_match_id: string | null;

  group_code: string | null;
}

export interface UpsertAdminMatchInput {
  id: string;
  stage: TournamentStage;
  matchday: number | null;
  groupOrder: number | null;
  groupName: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  kickoffAt: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  homeTeamId: string | null;
  awayTeamId: string | null;
}

export type AdminMatchesFormStateSchema = {
  id: string;
  stage: TournamentStage;
  matchday: string;
  groupOrder: string;
  groupName: string;
  homeTeam: string;
  awayTeam: string;

  homeTeamId: string;
  awayTeamId: string;
  homeTeamCode: string;
  awayTeamCode: string;
  kickoffAt: string;
  stadium: string;
  city: string;
  status: MatchStatus;
};
