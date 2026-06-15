import { useQuery } from '@tanstack/react-query';
import { getAuditPredictionsByMatch } from '../api/auditPredictions.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';

export function useAuditPredictionsByMatch(matchId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auditPredictionsByMatch(matchId ?? ''),
    queryFn: () => getAuditPredictionsByMatch(matchId!),
    enabled: Boolean(matchId) && enabled,
    staleTime: 30_000
  });
}
