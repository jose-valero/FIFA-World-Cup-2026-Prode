import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { incrementMaranita, type ReactionRow } from '../api/reactions.api';
import { useAuth } from '../../auth/hooks/useAuth';

export function useIncrementMaranita(matchId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ receiverId }: { receiverId: string }) => {
      if (!matchId) return Promise.reject(new Error('no_match'));
      return incrementMaranita(receiverId, matchId);
    },
    onMutate: async ({ receiverId }) => {
      if (!matchId || !user?.id) return undefined;
      const key = queryKeys.reactionsByMatch(matchId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ReactionRow[]>(key) ?? [];

      const existing = previous.find(
        (r) => r.giver_id === user.id && r.receiver_id === receiverId
      );
      const next: ReactionRow[] = existing
        ? previous.map((r) =>
            r.giver_id === user.id && r.receiver_id === receiverId
              ? { ...r, count: Math.min(r.count + 1, 25) }
              : r
          )
        : [...previous, { giver_id: user.id, receiver_id: receiverId, count: 1 }];

      queryClient.setQueryData<ReactionRow[]>(key, next);
      return { previous, key };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      if (matchId) queryClient.invalidateQueries({ queryKey: queryKeys.reactionsByMatch(matchId) });
    }
  });
}
