import { useQuery } from '@tanstack/react-query';
import { getAdminParticipantsOverview } from '../api/adminParticipants.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';

export function useAdminParticipantsOverview(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminParticipantsOverview,
    queryFn: getAdminParticipantsOverview,
    enabled,
    staleTime: 30_000
  });
}
