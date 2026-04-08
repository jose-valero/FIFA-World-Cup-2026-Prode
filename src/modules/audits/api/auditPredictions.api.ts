import { supabase } from '../../../lib/supabase/client';
import type { AuditPredictionRow } from '../types/auditPredictionRow.types';

export async function getAuditPredictionsByUser(userId: string): Promise<AuditPredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score')
    .eq('user_id', userId)
    .order('match_id', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
