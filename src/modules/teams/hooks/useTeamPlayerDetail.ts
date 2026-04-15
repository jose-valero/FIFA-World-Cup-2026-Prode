import { useQuery } from '@tanstack/react-query';
import { getTeamPlayerDetail } from '../api/teams.api';

export function useTeamPlayerDetail(teamId?: string, playerId?: string, enabled = true) {
  return useQuery({
    queryKey: ['teams', 'player-detail', teamId, playerId],
    queryFn: () => getTeamPlayerDetail(teamId!, playerId!),
    enabled: Boolean(teamId && playerId && enabled),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false
  });
}
