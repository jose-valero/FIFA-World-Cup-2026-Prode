import { supabase } from '../../../lib/supabase/client';
import type { LeaderboardRow } from '../types/leaderboard.types';

export async function getParticipantProfile(userId: string) {
  const { data } = await supabase.from('profiles').select('avatar_url, created_at').eq('id', userId).single();
  return data ?? null;
}

export async function getTopThreeAvatars(userIds: string[]): Promise<Map<string, string | null>> {
  if (userIds.length === 0) return new Map();

  const { data, error } = await supabase.from('profiles').select('id, avatar_url').in('id', userIds);

  if (error) throw error;

  return new Map((data ?? []).map((row) => [row.id as string, (row.avatar_url as string | null) ?? null]));
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_leaderboard');

  if (error) {
    throw error;
  }

  return (data ?? []) as LeaderboardRow[];
}
