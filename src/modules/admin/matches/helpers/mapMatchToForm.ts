import type { AdminMatchesFormStateSchema, AdminMatchRow } from '../types/admin.match.types';

export function toDateTimeLocal(isoDate: string) {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function mapMatchToForm(match: AdminMatchRow): AdminMatchesFormStateSchema {
  return {
    id: match.id,
    stage: match.stage,
    matchday: match.matchday !== null ? String(match.matchday) : '',
    groupOrder: match.group_order !== null ? String(match.group_order) : '',
    groupName: match.group_name,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeTeamId: match.home_team_id ?? '',
    awayTeamId: match.away_team_id ?? '',
    homeTeamCode: match.home_team_code ?? '',
    awayTeamCode: match.away_team_code ?? '',
    kickoffAt: toDateTimeLocal(match.kickoff_at),
    stadium: match.stadium,
    city: match.city,
    status: match.status
  };
}
