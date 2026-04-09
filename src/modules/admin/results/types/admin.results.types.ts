import type { MatchStatus } from '../../../matches/types/types';
import type { TournamentStage } from '../../../tournament/types/stages.types';

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
  official_home_score: number | null;
  official_away_score: number | null;
}

export type UpdateOfficialResultInput = {
  matchId: string;
  status: MatchStatus;
  officialHomeScore: number | null;
  officialAwayScore: number | null;
};
