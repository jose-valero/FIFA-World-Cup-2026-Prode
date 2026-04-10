import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncQualifiedTeamsIntoKnockout, updateOfficialResult } from '../api/adminResults.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import type { MatchStatus } from '../../../matches/types/types';
import type { AdminMatchRow } from '../types/admin.results.types';

type UpdateOfficialResultInput = {
  matchId: string;
  status: MatchStatus;
  officialHomeScore: number | null;
  officialAwayScore: number | null;
};

type UpdateOfficialResultData = {
  input: UpdateOfficialResultInput;
  syncWarning: string | null;
};

export function useUpdateOfficialResultMutation() {
  const queryClient = useQueryClient();

  return useMutation<UpdateOfficialResultData, Error, UpdateOfficialResultInput>({
    mutationFn: async (input): Promise<UpdateOfficialResultData> => {
      // El guardado del resultado es la operación crítica.
      // Si falla, lanza y el catch del caller lo maneja.
      await updateOfficialResult(input);

      // El sync es best-effort: si falla, el resultado ya está guardado.
      // No se lanza para que onSuccess siempre invalide los queries.
      let syncWarning: string | null = null;
      try {
        await syncQualifiedTeamsIntoKnockout();
      } catch (err) {
        syncWarning = err instanceof Error ? err.message : 'Error desconocido al sincronizar el bracket';
      }

      return { input, syncWarning };
    },

    onSuccess: async ({ input }) => {
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminResults }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.leaderboard })
      ]);
    }
  });
}
