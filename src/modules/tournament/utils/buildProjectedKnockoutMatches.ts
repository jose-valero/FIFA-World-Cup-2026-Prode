import type { Match } from '../matches/types';

type GroupStandingRow = {
  groupCode: string;
  teamId: string;
  teamCode: string | null;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rankInGroup: number;
};

type TemplateSource =
  | {
      type: 'group_position';
      groupCode: string;
      groupRank: number;
    }
  | {
      type: 'best_third_place';
      groupSet: string;
    }
  | {
      type: 'match_winner' | 'match_loser';
      matchId: string;
    };

type ResolvedTeam = {
  name: string;
  code: string | null;
};

const STAGE_GROUP_LABEL: Record<Exclude<Match['stage'], 'group_stage'>, string> = {
  round_of_32: 'Round of 32',
  round_of_16: 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  third_place: 'Third place',
  final: 'Final'
};

function createTemplateMatch(params: {
  id: string;
  stage: Exclude<Match['stage'], 'group_stage'>;
  home: TemplateSource;
  away: TemplateSource;
}): Match {
  const { id, stage, home, away } = params;

  return {
    id,
    stage,
    group: STAGE_GROUP_LABEL[stage],
    groupCode: null,
    homeTeam: '',
    awayTeam: '',
    homeTeamCode: null,
    awayTeamCode: null,
    kickoff: 'Por definir',
    kickoffAt: '2026-06-28T00:00:00Z',
    stadium: 'Por definir',
    city: 'Por definir',
    status: 'scheduled',
    displayOrder: Number(id),
    officialHomeScore: null,
    officialAwayScore: null,

    homeSourceType: home.type,
    homeSourceGroupCode: 'groupCode' in home ? home.groupCode : null,
    homeSourceGroupRank: 'groupRank' in home ? home.groupRank : null,
    homeSourceGroupSet: 'groupSet' in home ? home.groupSet : null,
    homeSourceMatchId: 'matchId' in home ? home.matchId : null,

    awaySourceType: away.type,
    awaySourceGroupCode: 'groupCode' in away ? away.groupCode : null,
    awaySourceGroupRank: 'groupRank' in away ? away.groupRank : null,
    awaySourceGroupSet: 'groupSet' in away ? away.groupSet : null,
    awaySourceMatchId: 'matchId' in away ? away.matchId : null
  };
}

const gp = (groupCode: string, groupRank: number): TemplateSource => ({
  type: 'group_position',
  groupCode,
  groupRank
});

const third = (groupSet: string): TemplateSource => ({
  type: 'best_third_place',
  groupSet
});

const winner = (matchId: string): TemplateSource => ({
  type: 'match_winner',
  matchId
});

const loser = (matchId: string): TemplateSource => ({
  type: 'match_loser',
  matchId
});

const KNOCKOUT_TEMPLATE: Match[] = [
  // LEFT SIDE - Round of 32
  createTemplateMatch({ id: '74', stage: 'round_of_32', home: gp('E', 1), away: third('ABCDF') }),
  createTemplateMatch({ id: '77', stage: 'round_of_32', home: gp('I', 1), away: third('CDFGH') }),
  createTemplateMatch({ id: '73', stage: 'round_of_32', home: gp('A', 2), away: gp('B', 2) }),
  createTemplateMatch({ id: '75', stage: 'round_of_32', home: gp('F', 1), away: gp('C', 2) }),

  createTemplateMatch({ id: '83', stage: 'round_of_32', home: gp('K', 2), away: gp('L', 2) }),
  createTemplateMatch({ id: '84', stage: 'round_of_32', home: gp('H', 1), away: gp('J', 2) }),
  createTemplateMatch({ id: '81', stage: 'round_of_32', home: gp('D', 1), away: third('BEFIJ') }),
  createTemplateMatch({ id: '82', stage: 'round_of_32', home: gp('G', 1), away: third('AEHIJ') }),

  // RIGHT SIDE - Round of 32
  createTemplateMatch({ id: '76', stage: 'round_of_32', home: gp('C', 1), away: gp('F', 2) }),
  createTemplateMatch({ id: '78', stage: 'round_of_32', home: gp('E', 2), away: gp('I', 2) }),
  createTemplateMatch({ id: '79', stage: 'round_of_32', home: gp('A', 1), away: third('CEFHI') }),
  createTemplateMatch({ id: '80', stage: 'round_of_32', home: gp('L', 1), away: third('EHIJK') }),

  createTemplateMatch({ id: '86', stage: 'round_of_32', home: gp('J', 1), away: gp('H', 2) }),
  createTemplateMatch({ id: '88', stage: 'round_of_32', home: gp('D', 2), away: gp('G', 2) }),
  createTemplateMatch({ id: '85', stage: 'round_of_32', home: gp('B', 1), away: third('EFGIJ') }),
  createTemplateMatch({ id: '87', stage: 'round_of_32', home: gp('K', 1), away: third('DEIJL') }),

  // Round of 16
  createTemplateMatch({ id: '89', stage: 'round_of_16', home: winner('74'), away: winner('77') }),
  createTemplateMatch({ id: '90', stage: 'round_of_16', home: winner('73'), away: winner('75') }),
  createTemplateMatch({ id: '93', stage: 'round_of_16', home: winner('83'), away: winner('84') }),
  createTemplateMatch({ id: '94', stage: 'round_of_16', home: winner('81'), away: winner('82') }),

  createTemplateMatch({ id: '91', stage: 'round_of_16', home: winner('76'), away: winner('78') }),
  createTemplateMatch({ id: '92', stage: 'round_of_16', home: winner('79'), away: winner('80') }),
  createTemplateMatch({ id: '95', stage: 'round_of_16', home: winner('86'), away: winner('88') }),
  createTemplateMatch({ id: '96', stage: 'round_of_16', home: winner('85'), away: winner('87') }),

  // Quarterfinals
  createTemplateMatch({ id: '97', stage: 'quarterfinals', home: winner('89'), away: winner('90') }),
  createTemplateMatch({ id: '98', stage: 'quarterfinals', home: winner('93'), away: winner('94') }),
  createTemplateMatch({ id: '99', stage: 'quarterfinals', home: winner('91'), away: winner('92') }),
  createTemplateMatch({ id: '100', stage: 'quarterfinals', home: winner('95'), away: winner('96') }),

  // Semifinals
  createTemplateMatch({ id: '101', stage: 'semifinals', home: winner('97'), away: winner('98') }),
  createTemplateMatch({ id: '102', stage: 'semifinals', home: winner('99'), away: winner('100') }),

  // Third place + Final
  createTemplateMatch({ id: '103', stage: 'third_place', home: loser('101'), away: loser('102') }),
  createTemplateMatch({ id: '104', stage: 'final', home: winner('101'), away: winner('102') })
];

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

function getPlaceholderFromSource(match: Match, side: 'home' | 'away') {
  const sourceType = side === 'home' ? match.homeSourceType : match.awaySourceType;
  const groupCode = side === 'home' ? match.homeSourceGroupCode : match.awaySourceGroupCode;
  const groupRank = side === 'home' ? match.homeSourceGroupRank : match.awaySourceGroupRank;
  const groupSet = side === 'home' ? match.homeSourceGroupSet : match.awaySourceGroupSet;
  const sourceMatchId = side === 'home' ? match.homeSourceMatchId : match.awaySourceMatchId;

  switch (sourceType) {
    case 'group_position':
      return groupCode && groupRank ? `${groupRank}${groupCode}` : 'Por definir';
    case 'best_third_place':
      return groupSet ? `3${groupSet}` : 'Por definir';
    case 'match_winner':
      return sourceMatchId ? `W${sourceMatchId}` : 'Por definir';
    case 'match_loser':
      return sourceMatchId ? `L${sourceMatchId}` : 'Por definir';
    default:
      return 'Por definir';
  }
}

function resolveWinnerOrLoser(sourceMatch: Match, target: 'winner' | 'loser'): ResolvedTeam | null {
  if (sourceMatch.officialHomeScore === null || sourceMatch.officialAwayScore === null) {
    return null;
  }

  if (sourceMatch.officialHomeScore === sourceMatch.officialAwayScore) {
    return null;
  }

  const home: ResolvedTeam = {
    name: sourceMatch.homeTeam || 'Por definir',
    code: sourceMatch.homeTeamCode
  };

  const away: ResolvedTeam = {
    name: sourceMatch.awayTeam || 'Por definir',
    code: sourceMatch.awayTeamCode
  };

  const winnerTeam = sourceMatch.officialHomeScore > sourceMatch.officialAwayScore ? home : away;
  const loserTeam = sourceMatch.officialHomeScore > sourceMatch.officialAwayScore ? away : home;

  return target === 'winner' ? winnerTeam : loserTeam;
}

function resolveSide(params: {
  match: Match;
  side: 'home' | 'away';
  standingsByGroupRank: Map<string, GroupStandingRow>;
  bestThirdAssignments: Map<string, GroupStandingRow>;
  projectedById: Map<string, Match>;
  finishedGroups: Set<string>;
  isWholeGroupStageFinished: boolean;
}): ResolvedTeam {
  const {
    match,
    side,
    standingsByGroupRank,
    bestThirdAssignments,
    projectedById,
    finishedGroups,
    isWholeGroupStageFinished
  } = params;

  const sourceType = side === 'home' ? match.homeSourceType : match.awaySourceType;
  const groupCode = side === 'home' ? match.homeSourceGroupCode : match.awaySourceGroupCode;
  const groupRank = side === 'home' ? match.homeSourceGroupRank : match.awaySourceGroupRank;
  const groupSet = side === 'home' ? match.homeSourceGroupSet : match.awaySourceGroupSet;
  const sourceMatchId = side === 'home' ? match.homeSourceMatchId : match.awaySourceMatchId;

  const currentName = side === 'home' ? match.homeTeam : match.awayTeam;
  const currentCode = side === 'home' ? match.homeTeamCode : match.awayTeamCode;

  if (sourceType === 'team' || sourceType === null) {
    return {
      name: currentName?.trim() ? currentName : 'Por definir',
      code: currentCode
    };
  }

  if (sourceType === 'group_position' && groupCode && groupRank) {
    if (!finishedGroups.has(groupCode)) {
      return {
        name: `${groupRank}${groupCode}`,
        code: null
      };
    }

    const row = standingsByGroupRank.get(`${groupCode}:${groupRank}`);

    if (row) {
      return {
        name: row.teamName,
        code: row.teamCode
      };
    }

    return {
      name: `${groupRank}${groupCode}`,
      code: null
    };
  }

  // if (sourceType === 'group_position' && groupCode && groupRank) {
  //   const row = standingsByGroupRank.get(`${groupCode}:${groupRank}`);
  //   if (row) {
  //     return {
  //       name: row.teamName,
  //       code: row.teamCode
  //     };
  //   }

  //   return {
  //     name: `${groupRank}${groupCode}`,
  //     code: null
  //   };
  // }

  if (sourceType === 'best_third_place' && groupSet) {
    if (!isWholeGroupStageFinished) {
      return {
        name: `3${groupSet}`,
        code: null
      };
    }

    const row = bestThirdAssignments.get(groupSet);

    if (row) {
      return {
        name: row.teamName,
        code: row.teamCode
      };
    }

    return {
      name: `3${groupSet}`,
      code: null
    };
  }

  // if (sourceType === 'best_third_place' && groupSet) {
  //   const row = bestThirdAssignments.get(groupSet);
  //   if (row) {
  //     return {
  //       name: row.teamName,
  //       code: row.teamCode
  //     };
  //   }

  //   return {
  //     name: `3${groupSet}`,
  //     code: null
  //   };
  // }

  if ((sourceType === 'match_winner' || sourceType === 'match_loser') && sourceMatchId) {
    const sourceMatch = projectedById.get(sourceMatchId);

    if (sourceMatch) {
      const resolved = resolveWinnerOrLoser(sourceMatch, sourceType === 'match_winner' ? 'winner' : 'loser');

      if (resolved) {
        return resolved;
      }
    }

    return {
      name: getPlaceholderFromSource(match, side),
      code: null
    };
  }

  return {
    name: 'Por definir',
    code: null
  };
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
