import { useQuery } from '@tanstack/react-query';
import { getMatches } from '../api/matches.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getEffectiveMatchStatus } from '../../../shared/utils/getEffectiveMatchStatus';

export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: getMatches,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      // Use effective status so matches that started but haven't synced yet
      // still trigger the fast polling interval.
      const hasLive = query.state.data?.some((m) => getEffectiveMatchStatus(m) === 'live') ?? false;
      return hasLive ? 10_000 : 60_000;
    },
    refetchIntervalInBackground: false
  });
}
