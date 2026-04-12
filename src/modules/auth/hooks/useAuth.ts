import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '../../../app/providers/AuthProvider';
import { useMyProfile } from '../../profile/hooks/useMyProfile';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { UseAuthValueSchema } from '../types/auth.types';

export function useAuth(): UseAuthValueSchema {
  const auth = useAuthContext();
  const queryClient = useQueryClient();

  const { data: profile = null, isPending: isProfilePending } = useMyProfile(auth.user?.id);

  const refreshProfile = React.useCallback(async () => {
    if (!auth.user?.id) return;

    await queryClient.invalidateQueries({
      queryKey: queryKeys.myProfile(auth.user.id)
    });
  }, [auth.user?.id, queryClient]);

  return React.useMemo(
    () => ({
      ...auth,
      profile,
      isLoading: auth.isLoading || Boolean(auth.user?.id && isProfilePending),
      refreshProfile
    }),
    [auth, profile, isProfilePending, refreshProfile]
  );
}
