import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import { getAdminMatches } from '../api/adminMatches.api';

export function useAdminMatches() {
  return useQuery({
    queryKey: queryKeys.adminMatches,
    queryFn: getAdminMatches
  });
}
