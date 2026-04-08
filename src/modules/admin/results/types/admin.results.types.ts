import type { TournamentStage } from '../../../tournament/utils/stages';

export type AdminMatchStatus = 'scheduled' | 'live' | 'finished';

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
  status: AdminMatchStatus;
  official_home_score: number | null;
  official_away_score: number | null;
}

export type UpdateOfficialResultInput = {
  matchId: string;
  status: AdminMatchStatus;
  officialHomeScore: number | null;
  officialAwayScore: number | null;
};
