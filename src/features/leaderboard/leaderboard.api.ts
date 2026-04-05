import { supabase } from '../../lib/supabase/client';

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
  scored_predictions: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard');

  if (error) {
    throw error;
  }

  return (data ?? []) as LeaderboardRow[];
}
