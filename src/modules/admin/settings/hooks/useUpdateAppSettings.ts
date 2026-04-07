import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/react-query/queryKeys';
import { updateAppSettings } from '../api/appSettings.api';

export function useUpdateAppSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppSettings,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.appSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.matches })
      ]);
    }
  });
}
