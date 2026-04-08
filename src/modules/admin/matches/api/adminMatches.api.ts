import { supabase } from '../../../../lib/supabase/client';
import type { AdminMatchRow, UpsertAdminMatchInput } from '../types/admin.match.types';

// export interface AdminMatchRow {
//   id: string;
//   stage: TournamentStage;
//   matchday: number | null;
//   group_order: number | null;
//   group_name: string;
//   home_team: string;
//   away_team: string;
//   home_team_code: string | null;
//   away_team_code: string | null;
//   kickoff_at: string;
//   stadium: string;
//   city: string;
//   status: MatchStatus;

//   official_away_score: number | null;
//   official_home_score: number | null;

//   home_team_id: string | null;
//   home_source_type: 'team' | 'group_position' | 'best_third_place' | 'match_winner' | 'match_loser' | null;
//   home_source_group_code: string | null;
//   home_source_group_rank: number | null;
//   home_source_group_set: string | null;
//   home_source_match_id: string | null;

//   away_team_id: string | null;
//   away_source_type: 'team' | 'group_position' | 'best_third_place' | 'match_winner' | 'match_loser' | null;
//   away_source_group_code: string | null;
//   away_source_group_rank: number | null;
//   away_source_group_set: string | null;
//   away_source_match_id: string | null;

//   group_code: string | null;
// }

// export interface UpsertAdminMatchInput {
//   id: string;
//   stage: TournamentStage;
//   matchday: number | null;
//   groupOrder: number | null;
//   groupName: string;
//   homeTeam: string;
//   awayTeam: string;
//   homeTeamCode: string | null;
//   awayTeamCode: string | null;
//   kickoffAt: string;
//   stadium: string;
//   city: string;
//   status: MatchStatus;
//   homeTeamId: string | null;
//   awayTeamId: string | null;
// }

// esto no se usa, pendiente
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
      group_code,
      home_team,
      away_team,
      home_team_id,
      away_team_id,
      home_team_code,
      away_team_code,
      kickoff_at,
      stadium,
      city,
      status,
      official_home_score,
      official_away_score,
      home_source_type,
      home_source_group_code,
      home_source_group_rank,
      home_source_group_set,
      home_source_match_id,
      away_source_type,
      away_source_group_code,
      away_source_group_rank,
      away_source_group_set,
      away_source_match_id
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

export async function createAdminMatch(input: UpsertAdminMatchInput): Promise<void> {
  const { error } = await supabase.from('matches').insert({
    id: input.id,
    stage: input.stage,
    matchday: input.matchday,
    group_order: input.groupOrder,
    group_name: input.groupName,
    home_team: input.homeTeam,
    away_team: input.awayTeam,
    home_team_id: input.homeTeamId,
    away_team_id: input.awayTeamId,
    home_team_code: input.homeTeamCode,
    away_team_code: input.awayTeamCode,
    kickoff_at: input.kickoffAt,
    stadium: input.stadium,
    city: input.city,
    status: input.status
  });

  if (error) {
    throw error;
  }
}

export async function updateAdminMatch(input: UpsertAdminMatchInput): Promise<void> {
  const { error } = await supabase
    .from('matches')
    .update({
      stage: input.stage,
      matchday: input.matchday,
      group_order: input.groupOrder,
      group_name: input.groupName,
      home_team: input.homeTeam,
      away_team: input.awayTeam,
      home_team_id: input.homeTeamId,
      away_team_id: input.awayTeamId,
      home_team_code: input.homeTeamCode,
      away_team_code: input.awayTeamCode,
      kickoff_at: input.kickoffAt,
      stadium: input.stadium,
      city: input.city,
      status: input.status
    })
    .eq('id', input.id);

  if (error) {
    throw error;
  }
}

export async function deleteAdminMatch(matchId: string): Promise<void> {
  const { error } = await supabase.from('matches').delete().eq('id', matchId);

  if (error) {
    throw error;
  }
}
