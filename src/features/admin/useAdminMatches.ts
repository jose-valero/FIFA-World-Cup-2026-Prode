import { useQuery } from '@tanstack/react-query';
import { getAdminMatches } from './adminMatches.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useAdminMatches() {
  return useQuery({
    queryKey: queryKeys.adminMatches,
    queryFn: getAdminMatches
  });
}
