import { useQuery } from '@tanstack/react-query';
import { getAuditPredictionsByMatches } from '../api/auditPredictions.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { InlinePrediction } from '../../leaderboard/types/leaderboard.types';

// Returns a Map<matchId, Map<userId, InlinePrediction>> for all requested live matches.
// Uses a single Supabase query (.in) to fetch all predictions at once.
export function useAuditPredictionsByMatches(
  matchIds: string[],
  enabled: boolean
): Map<string, Map<string, InlinePrediction>> {
  const stableKey = matchIds.slice().sort().join(',');

  const { data = [] } = useQuery({
    queryKey: [...queryKeys.auditPredictionsByMatch('multi'), stableKey],
    queryFn: () => getAuditPredictionsByMatches(matchIds),
    enabled: enabled && matchIds.length > 0,
    staleTime: 30_000
  });

  const result = new Map<string, Map<string, InlinePrediction>>();
  for (const matchId of matchIds) {
    result.set(matchId, new Map());
  }
  for (const row of data) {
    const userMap = result.get(row.match_id) ?? new Map<string, InlinePrediction>();
    userMap.set(row.user_id, { homeScore: row.home_score, awayScore: row.away_score });
    result.set(row.match_id, userMap);
  }
  return result;
}
