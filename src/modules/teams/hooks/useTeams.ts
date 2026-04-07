import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getTeams } from '../api/teams.api';

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams
  });
}
