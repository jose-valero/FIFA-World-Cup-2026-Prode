import { useQuery } from '@tanstack/react-query';
import { getMatches } from '../api/matches.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';

export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: getMatches,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const hasLive = query.state.data?.some((m) => m.status === 'live') ?? false;
      return hasLive ? 20_000 : 60_000;
    },
    refetchIntervalInBackground: false
  });
}
