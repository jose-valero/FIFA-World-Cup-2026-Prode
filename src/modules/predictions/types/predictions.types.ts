export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
}

export interface UpsertPredictionInput {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export type PredictionView = 'matches' | 'my-predictions';
