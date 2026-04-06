import { useQuery } from '@tanstack/react-query';
import { getTeams } from './teams.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: getTeams
  });
}
