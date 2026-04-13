import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '../api/profile.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { Profile } from '../types/profile.types';

export function useMyProfile(userId?: string) {
  return useQuery<Profile | null>({
    queryKey: userId ? queryKeys.myProfile(userId) : ['profile', 'me', 'anonymous'],
    queryFn: () => getMyProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    retry: 1
  });
}
