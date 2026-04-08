import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncQualifiedTeamsIntoKnockout, updateOfficialResult } from '../api/adminResults.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import type { AdminMatchRow, UpdateOfficialResultInput } from '../types/admin.results.types';

function shouldSyncKnockout(input: UpdateOfficialResultInput) {
  return input.status === 'finished';
}

export function useUpdateOfficialResultMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateOfficialResultInput) => {
      await updateOfficialResult(input);

      if (shouldSyncKnockout(input)) {
        await syncQualifiedTeamsIntoKnockout();
      }

      return input;
    },

    onSuccess: async (input) => {
      queryClient.setQueryData<AdminMatchRow[] | undefined>(queryKeys.adminResults, (prev) => {
        if (!prev) return prev;

        return prev.map((match) =>
          match.id === input.matchId
            ? {
                ...match,
                status: input.status,
                official_home_score: input.officialHomeScore,
                official_away_score: input.officialAwayScore
              }
            : match
        );
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard });

      if (shouldSyncKnockout(input)) {
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches });
      }
    }
  });
}
