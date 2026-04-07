import { supabase } from '../../lib/supabase/client';

export interface AuditPredictionRow {
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
}

export async function getAuditPredictions(): Promise<AuditPredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score')
    .order('match_id', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
