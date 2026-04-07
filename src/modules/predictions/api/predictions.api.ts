import { supabase } from '../../../lib/supabase/client';
import type { PredictionRow, UpsertPredictionInput } from '../types/predictions.types';

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

export async function deletePrediction(params: { userId: string; matchId: string }) {
  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('user_id', params.userId)
    .eq('match_id', params.matchId);

  if (error) {
    throw error;
  }
}
