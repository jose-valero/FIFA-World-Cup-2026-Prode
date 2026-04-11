import type { Match } from '../../matches/types/types';
import { sortGroupRows } from '../../tournament/utils/sortGroupStandings';
import type { ClientGroupStandingRow } from '../types/fixture.types';
import { groupSortable } from './groupSortable';

export function buildClientGroupStandings(matches: Match[]): ClientGroupStandingRow[] {
  const allGroupMatches = matches.filter(
    (match) => match.stage === 'group_stage' && match.groupCode && match.homeTeam && match.awayTeam
  );

  // Pre-index by group for H2H sort
  const matchesByGroup = allGroupMatches.reduce<Map<string, Match[]>>((acc, m) => {
    const key = m.groupCode as string;
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)!.push(m);
    return acc;
  }, new Map());

  const table = new Map<string, ClientGroupStandingRow>();

  function ensureTeam(groupCode: string, teamName: string, teamCode: string | null) {
    const key = `${groupCode}:${teamCode || teamName}`;

    if (!table.has(key)) {
      table.set(key, {
        group_code: groupCode,
        team_id: key,
        team_code: teamCode || '',
        team_name: teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        rank_in_group: 0
      });
    }

    return table.get(key)!;
  }

  for (const match of allGroupMatches) {
    const groupCode = match.groupCode as string;

    const home = ensureTeam(groupCode, match.homeTeam, match.homeTeamCode);
    const away = ensureTeam(groupCode, match.awayTeam, match.awayTeamCode);

    if (match.officialHomeScore === null || match.officialAwayScore === null) {
      continue;
    }

    const homeGoals = match.officialHomeScore;
    const awayGoals = match.officialAwayScore;

    home.played += 1;
    away.played += 1;

    home.goals_for += homeGoals;
    home.goals_against += awayGoals;
    away.goals_for += awayGoals;
    away.goals_against += homeGoals;

    if (homeGoals > awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (homeGoals < awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const rows = Array.from(table.values()).map((row) => ({
    ...row,
    goal_difference: row.goals_for - row.goals_against
  }));

  const grouped = rows.reduce<Record<string, ClientGroupStandingRow[]>>((acc, row) => {
    if (!acc[row.group_code]) {
      acc[row.group_code] = [];
    }
    acc[row.group_code].push(row);
    return acc;
  }, {});

  return Object.entries(grouped).flatMap(([groupCode, groupRows]) => {
    const groupMatchesForSort = matchesByGroup.get(groupCode) ?? [];
    const sorted = sortGroupRows(groupRows.map(groupSortable), groupMatchesForSort);

    return sorted.map((row, index) => ({
      ...row,
      group_code: groupCode,
      rank_in_group: index + 1
    }));
  });
}
