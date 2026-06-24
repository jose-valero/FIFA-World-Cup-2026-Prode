import { supabase } from '../../../lib/supabase/client';
import type { AuditPredictionRow } from '../types/auditPredictionRow.types';

export async function getAuditPredictionsByUser(userId: string): Promise<AuditPredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score, knockout_tiebreak, knockout_winner')
    .eq('user_id', userId)
    .order('match_id', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export type MatchPredictionRow = {
  user_id: string;
  home_score: number;
  away_score: number;
  knockout_tiebreak: string | null;
  knockout_winner: string | null;
};

export async function getAuditPredictionsByMatch(matchId: string): Promise<MatchPredictionRow[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, home_score, away_score, knockout_tiebreak, knockout_winner')
    .eq('match_id', matchId);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export type MatchPredictionRowWithMatchId = MatchPredictionRow & { match_id: string };

export async function getAuditPredictionsByMatches(matchIds: string[]): Promise<MatchPredictionRowWithMatchId[]> {
  if (matchIds.length === 0) return [];
  const { data, error } = await supabase
    .from('predictions')
    .select('user_id, match_id, home_score, away_score, knockout_tiebreak, knockout_winner')
    .in('match_id', matchIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as MatchPredictionRowWithMatchId[];
}
