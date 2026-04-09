import type { Match } from '../../matches/types/types';
import type { GroupStandingRow, ResolvedTeam } from '../types/stages.types';

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

export function resolveSide(params: {
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
