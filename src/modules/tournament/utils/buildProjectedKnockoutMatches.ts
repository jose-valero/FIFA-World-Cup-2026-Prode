import type { Match } from '../../matches/types/types';
import { KNOCKOUT_TEMPLATE } from '../constants/mockTemplates';
import type { GroupStandingRow } from '../types/stages.types';
import { resolveSide } from './resolveSide';

function sortRows(rows: GroupStandingRow[]) {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

function buildClientGroupStandings(matches: Match[]): GroupStandingRow[] {
  const groupMatches = matches.filter(
    (match) => match.stage === 'group_stage' && match.groupCode && match.homeTeam && match.awayTeam
  );

  const table = new Map<string, GroupStandingRow>();

  function ensureTeam(groupCode: string, teamName: string, teamCode: string | null) {
    const key = `${groupCode}:${teamCode || teamName}`;

    if (!table.has(key)) {
      table.set(key, {
        groupCode,
        teamId: key,
        teamCode: teamCode || '',
        teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        rankInGroup: 0
      });
    }

    return table.get(key)!;
  }

  for (const match of groupMatches) {
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

    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;

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
    goalDifference: row.goalsFor - row.goalsAgainst
  }));

  const grouped = rows.reduce<Record<string, GroupStandingRow[]>>((acc, row) => {
    if (!acc[row.groupCode]) {
      acc[row.groupCode] = [];
    }
    acc[row.groupCode].push(row);
    return acc;
  }, {});

  return Object.entries(grouped).flatMap(([groupCode, groupRows]) => {
    const sorted = sortRows(groupRows);

    return sorted.map((row, index) => ({
      ...row,
      groupCode,
      rankInGroup: index + 1
    }));
  });
}

function getQualifiedThirdPlaces(standings: GroupStandingRow[]) {
  return sortRows(standings.filter((row) => row.rankInGroup === 3)).slice(0, 8);
}

function assignBestThirdSlots(slotSets: string[], qualifiedThirds: GroupStandingRow[]) {
  const uniqueSets = [...new Set(slotSets)];
  const result = new Map<string, GroupStandingRow>();

  function solve(
    pendingSets: string[],
    usedGroups: Set<string>,
    acc: Map<string, GroupStandingRow>
  ): Map<string, GroupStandingRow> | null {
    if (pendingSets.length === 0) return acc;

    const next = [...pendingSets]
      .map((setValue) => ({
        setValue,
        candidates: qualifiedThirds.filter((row) => setValue.includes(row.groupCode) && !usedGroups.has(row.groupCode))
      }))
      .sort((a, b) => a.candidates.length - b.candidates.length)[0];

    if (!next || next.candidates.length === 0) return null;

    const remaining = pendingSets.filter((setValue) => setValue !== next.setValue);

    for (const candidate of next.candidates) {
      const nextUsed = new Set(usedGroups);
      nextUsed.add(candidate.groupCode);

      const nextAcc = new Map(acc);
      nextAcc.set(next.setValue, candidate);

      const solved = solve(remaining, nextUsed, nextAcc);
      if (solved) return solved;
    }

    return null;
  }

  return solve(uniqueSets, new Set<string>(), result) ?? new Map<string, GroupStandingRow>();
}

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

function getFinishedGroups(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage' && match.groupCode);

  const grouped = groupStageMatches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = match.groupCode as string;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(match);
    return acc;
  }, {});

  return new Set(
    Object.entries(grouped)
      .filter(
        ([, groupMatches]) => groupMatches.length > 0 && groupMatches.every((match) => match.status === 'finished')
      )
      .map(([groupCode]) => groupCode)
  );
}

function isGroupStageFullyCompleted(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');

  if (groupStageMatches.length === 0) {
    return false;
  }

  return groupStageMatches.every((match) => match.status === 'finished');
}

export function buildProjectedKnockoutMatches(allMatches: Match[]): Match[] {
  const realKnockoutById = new Map(
    allMatches.filter((match) => match.stage !== 'group_stage').map((match) => [match.id, match] as const)
  );

  const standings = buildClientGroupStandings(allMatches);

  const standingsByGroupRank = new Map(standings.map((row) => [`${row.groupCode}:${row.rankInGroup}`, row] as const));

  const qualifiedThirds = getQualifiedThirdPlaces(standings);
  const finishedGroups = getFinishedGroups(allMatches);
  const isWholeGroupStageFinished = isGroupStageFullyCompleted(allMatches);

  const bestThirdSlotSets = KNOCKOUT_TEMPLATE.flatMap((match) =>
    [match.homeSourceGroupSet, match.awaySourceGroupSet].filter(Boolean)
  ) as string[];

  const bestThirdAssignments = assignBestThirdSlots(bestThirdSlotSets, qualifiedThirds);

  const projectedById = new Map<string, Match>();

  for (const templateMatch of sortMatches(KNOCKOUT_TEMPLATE)) {
    const realMatch = realKnockoutById.get(templateMatch.id);

    const baseMatch: Match = realMatch
      ? {
          ...templateMatch,
          ...realMatch
        }
      : templateMatch;

    const resolvedHome = resolveSide({
      match: baseMatch,
      side: 'home',
      standingsByGroupRank,
      bestThirdAssignments,
      projectedById,
      finishedGroups,
      isWholeGroupStageFinished
    });

    const resolvedAway = resolveSide({
      match: baseMatch,
      side: 'away',
      standingsByGroupRank,
      bestThirdAssignments,
      projectedById,
      finishedGroups,
      isWholeGroupStageFinished
    });

    const projectedMatch: Match = {
      ...baseMatch,
      homeTeam: resolvedHome.name,
      homeTeamCode: resolvedHome.code,
      awayTeam: resolvedAway.name,
      awayTeamCode: resolvedAway.code
    };

    projectedById.set(projectedMatch.id, projectedMatch);
  }

  return sortMatches(Array.from(projectedById.values()));
}
