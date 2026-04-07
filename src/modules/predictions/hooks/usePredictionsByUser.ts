import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getPredictionsByUser } from '../api/predictions.api';

export function usePredictionsByUser(userId: string | null) {
  return useQuery({
    queryKey: queryKeys.predictions(userId ?? 'algo_anonimo'),
    queryFn: () => getPredictionsByUser(userId as string),
    enabled: Boolean(userId)
  });
}
