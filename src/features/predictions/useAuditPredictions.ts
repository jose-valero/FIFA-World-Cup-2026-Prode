import { useQuery } from '@tanstack/react-query';
import { getAuditPredictions } from './auditPredictions.api';
import { queryKeys } from '../../lib/react-query/queryKeys';

export function useAuditPredictions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditPredictions,
    queryFn: getAuditPredictions,
    enabled
  });
}
