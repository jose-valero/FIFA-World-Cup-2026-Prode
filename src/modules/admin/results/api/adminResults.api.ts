import { supabase } from '../../../../lib/supabase/client';
import type { AdminMatchRow, AdminMatchStatus } from '../types/admin.results.types';

export async function getAdminMatches(): Promise<AdminMatchRow[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      stage,
      matchday,
      group_order,
      group_name,
      home_team,
      away_team,
      home_team_code,
      away_team_code,
      kickoff_at,
      stadium,
      city,
      status,
      official_home_score,
      official_away_score
      `
    )
    .order('stage', { ascending: true })
    .order('group_name', { ascending: true })
    .order('matchday', { ascending: true, nullsFirst: false })
    .order('group_order', { ascending: true, nullsFirst: false })
    .order('kickoff_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

interface UpdateOfficialResultInput {
  matchId: string;
  status: AdminMatchStatus;
  officialHomeScore: number | null;
  officialAwayScore: number | null;
}

export async function updateOfficialResult({
  matchId,
  status,
  officialHomeScore,
  officialAwayScore
}: UpdateOfficialResultInput): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      status,
      official_home_score: officialHomeScore,
      official_away_score: officialAwayScore
    })
    .eq('id', matchId);

  if (error) {
    throw error;
  }
}

export async function syncQualifiedTeamsIntoKnockout() {
  const { data, error } = await supabase.rpc('sync_qualified_teams_into_knockout');

  if (error) {
    throw new Error(error.message || 'No se pudo sincronizar el knockout');
  }

  return data;
}
