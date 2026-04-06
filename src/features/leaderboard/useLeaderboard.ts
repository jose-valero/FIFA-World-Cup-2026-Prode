import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from './leaderboard.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: getLeaderboard
  });
}
