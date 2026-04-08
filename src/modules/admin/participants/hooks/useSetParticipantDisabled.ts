import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setParticipantDisabled } from '../api/adminParticipants.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';

export function useSetParticipantDisabled() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setParticipantDisabled,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminParticipantsOverview }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
      ]);
    }
  });
}
