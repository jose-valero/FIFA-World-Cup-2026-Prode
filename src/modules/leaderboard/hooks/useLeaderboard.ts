import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getLeaderboard, getLeaderboardByPhase, type LeaderboardPhase } from '../api/leaderboard.api';

export { type LeaderboardPhase };

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: getLeaderboard
  });
}

export function useLeaderboardByPhase(phase: LeaderboardPhase) {
  return useQuery({
    queryKey: queryKeys.leaderboardByPhase(phase),
    queryFn: () => getLeaderboardByPhase(phase)
  });
}
