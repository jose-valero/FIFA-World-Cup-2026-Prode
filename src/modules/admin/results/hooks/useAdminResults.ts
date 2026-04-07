import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import { getAdminMatches } from '../api/adminResults.api';

export function useAdminResults() {
  return useQuery({
    queryKey: queryKeys.adminResults,
    queryFn: getAdminMatches
  });
}
