import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getAuditPredictions } from '../api/auditPredictions.api';

export function useAuditPredictions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditPredictions,
    queryFn: getAuditPredictions,
    enabled
  });
}
