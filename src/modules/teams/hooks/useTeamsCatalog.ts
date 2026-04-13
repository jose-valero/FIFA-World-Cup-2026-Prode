import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getTeamsCatalog } from '../api/teams.api';

export function useTeamsCatalog() {
  return useQuery({
    queryKey: queryKeys.teamsCatalog,
    queryFn: getTeamsCatalog,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false
  });
}
