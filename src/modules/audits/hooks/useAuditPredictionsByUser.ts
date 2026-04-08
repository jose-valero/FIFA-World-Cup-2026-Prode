import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getAuditPredictionsByUser } from '../api/auditPredictions.api';

export function useAuditPredictionsByUser(userId?: string, enabled = true) {
  return useQuery({
    queryKey: userId ? queryKeys.auditPredictionsByUser(userId) : ['audit-predictions', 'user', 'unknown'],
    queryFn: () => getAuditPredictionsByUser(userId!),
    enabled: enabled && Boolean(userId),
    staleTime: 30_000
  });
}
