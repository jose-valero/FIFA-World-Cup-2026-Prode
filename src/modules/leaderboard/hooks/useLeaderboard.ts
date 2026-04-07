import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getLeaderboard } from '../api/leaderboard.api';

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: getLeaderboard
  });
}
