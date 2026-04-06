import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAdminMatch, deleteAdminMatch, updateAdminMatch } from './adminMatches.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useCreateAdminMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAdminMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches })
      ]);
    }
  });
}

export function useUpdateAdminMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches })
      ]);
    }
  });
}

export function useDeleteAdminMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches })
      ]);
    }
  });
}
