import { supabase } from '../../../lib/supabase/client';
import type { TournamentStage } from '../../tournament/types/stages.types';
import type { Match, MatchSourceType, MatchStatus } from '../types/types';

interface MatchRow {
  id: string;
  stage: TournamentStage;
  group_name: string;
  group_code: string | null;
  home_team: string;
  away_team: string;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff_at: string;
  stadium: string;
  city: string;
  status: MatchStatus;
  display_order: number | null;
  official_home_score: number | null;
  official_away_score: number | null;

  home_source_type: MatchSourceType | null;
  home_source_group_code: string | null;
  home_source_group_rank: number | null;
  home_source_group_set: string | null;
  home_source_match_id: string | null;

  away_source_type: MatchSourceType | null;
  away_source_group_code: string | null;
  away_source_group_rank: number | null;
  away_source_group_set: string | null;
  away_source_match_id: string | null;
}

function formatKickoff(isoDate: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}

function mapMatchRow(row: MatchRow): Match {
  return {
    id: row.id,
    stage: row.stage,
    group: row.group_name,
    groupCode: row.group_code,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeTeamCode: row.home_team_code,
    awayTeamCode: row.away_team_code,
    kickoff: formatKickoff(row.kickoff_at),
    kickoffAt: row.kickoff_at,
    stadium: row.stadium,
    city: row.city,
    status: row.status,
    displayOrder: row.display_order,
    officialHomeScore: row.official_home_score,
    officialAwayScore: row.official_away_score,

    homeSourceType: row.home_source_type,
    homeSourceGroupCode: row.home_source_group_code,
    homeSourceGroupRank: row.home_source_group_rank,
    homeSourceGroupSet: row.home_source_group_set,
    homeSourceMatchId: row.home_source_match_id,

    awaySourceType: row.away_source_type,
    awaySourceGroupCode: row.away_source_group_code,
    awaySourceGroupRank: row.away_source_group_rank,
    awaySourceGroupSet: row.away_source_group_set,
    awaySourceMatchId: row.away_source_match_id
  };
}

export async function getMatches(): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      id,
      stage,
      group_name,
      group_code,
      home_team,
      away_team,
      home_team_code,
      away_team_code,
      kickoff_at,
      stadium,
      city,
      status,
      display_order,
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
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('kickoff_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapMatchRow);
}
