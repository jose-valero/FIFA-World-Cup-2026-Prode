import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getTeamCatalogById } from '../api/teams.api';

export function useTeamCatalogItem(teamId?: string) {
  return useQuery({
    queryKey: teamId ? queryKeys.teamCatalogItem(teamId) : ['teams', 'catalog', 'detail', 'unknown'],
    queryFn: () => getTeamCatalogById(teamId!),
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false
  });
}
