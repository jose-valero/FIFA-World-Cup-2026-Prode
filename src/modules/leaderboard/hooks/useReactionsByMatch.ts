import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getReactionsByMatch } from '../api/reactions.api';

export function useReactionsByMatch(matchId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.reactionsByMatch(matchId ?? ''),
    queryFn: () => getReactionsByMatch(matchId!),
    enabled: Boolean(matchId) && enabled,
    staleTime: 10_000
  });
}
