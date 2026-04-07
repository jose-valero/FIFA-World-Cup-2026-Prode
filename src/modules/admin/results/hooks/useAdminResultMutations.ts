import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncQualifiedTeamsIntoKnockout, updateOfficialResult } from '../api/adminResults.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';

export function useUpdateOfficialResultMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      matchId: string;
      status: 'scheduled' | 'live' | 'finished';
      officialHomeScore: number | null;
      officialAwayScore: number | null;
    }) => {
      await updateOfficialResult(input);
      await syncQualifiedTeamsIntoKnockout();
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminResults }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
      ]);
    }
  });
}
