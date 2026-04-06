import { useQuery } from '@tanstack/react-query';
import { getMatches } from './matches.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useMatches() {
  return useQuery({
    queryKey: queryKeys.matches,
    queryFn: getMatches
  });
}
