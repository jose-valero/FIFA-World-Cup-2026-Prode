import type { SortableStandingRow } from '../../tournament/utils/sortGroupStandings';
import type { ClientGroupStandingRow } from '../types/fixture.types';

export function groupSortable(row: ClientGroupStandingRow): ClientGroupStandingRow & SortableStandingRow {
  return {
    ...row,
    sortKey: row.team_code || row.team_name,
    teamCode: row.team_code,
    teamName: row.team_name,
    points: row.points,
    wins: row.wins,
    goalsFor: row.goals_for,
    goalDifference: row.goal_difference
  };
}
