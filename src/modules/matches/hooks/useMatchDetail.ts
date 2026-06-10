import { useQuery } from '@tanstack/react-query';
import { getMatchDetail } from '../api/matchDetail.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { MatchDetailPayload } from '../types/matchDetail.types';

export function useMatchDetail(matchId: string | undefined) {
  return useQuery<MatchDetailPayload>({
    queryKey: queryKeys.matchDetail(matchId ?? ''),
    queryFn: () => getMatchDetail(matchId!),
    enabled: Boolean(matchId),
    refetchInterval: (query) => (query.state.data?.status === 'live' ? 15_000 : 60_000),
    staleTime: 10_000,
    retry: 1
  });
}
