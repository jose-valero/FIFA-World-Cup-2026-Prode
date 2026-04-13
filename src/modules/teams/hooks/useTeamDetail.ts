import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getTeamDetail } from '../api/teams.api';

export function useTeamDetail(teamId?: string) {
  return useQuery({
    queryKey: teamId ? queryKeys.teamDetail(teamId) : ['teams', 'detail', 'unknown'],
    queryFn: () => getTeamDetail(teamId!),
    enabled: Boolean(teamId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false
  });
}
