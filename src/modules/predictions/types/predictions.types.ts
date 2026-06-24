export type KnockoutTiebreak = 'extra_time' | 'penalties';
export type KnockoutWinner = 'home' | 'away';

export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  knockout_tiebreak: KnockoutTiebreak | null;
  knockout_winner: KnockoutWinner | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertPredictionInput {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  knockoutTiebreak: KnockoutTiebreak | null;
  knockoutWinner: KnockoutWinner | null;
}

export type PredictionView = 'matches' | 'my-predictions';
