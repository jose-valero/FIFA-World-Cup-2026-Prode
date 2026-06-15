import { supabase } from '../../../lib/supabase/client';

export type ReactionRow = { giver_id: string; receiver_id: string; count: number };

export type MaranitaResult =
  | { ok: true; count: number; at_limit: boolean }
  | { ok: false; error: string };

export async function getReactionsByMatch(matchId: string): Promise<ReactionRow[]> {
  const { data, error } = await supabase
    .from('prediction_reactions')
    .select('giver_id, receiver_id, count')
    .eq('match_id', matchId);
  if (error) throw error;
  return data ?? [];
}

export async function incrementMaranita(receiverId: string, matchId: string): Promise<MaranitaResult> {
  const { data, error } = await supabase.rpc('increment_maranita', {
    p_receiver_id: receiverId,
    p_match_id: matchId
  });
  if (error) throw error;
  return data as MaranitaResult;
}
