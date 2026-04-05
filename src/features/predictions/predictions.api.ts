import { supabase } from '../../lib/supabase/client';

export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  updated_at: string;
}

interface UpsertPredictionInput {
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
}

export async function getPredictionsByUser(userId: string): Promise<PredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('id, user_id, match_id, home_score, away_score, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function upsertPrediction({
  userId,
  matchId,
  homeScore,
  awayScore
}: UpsertPredictionInput): Promise<PredictionRow> {
  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore
      },
      {
        onConflict: 'user_id,match_id'
      }
    )
    .select('id, user_id, match_id, home_score, away_score, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
