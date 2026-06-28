import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncQualifiedTeamsIntoKnockout } from '../api/adminResults.api';
import { queryKeys } from '../../../../lib/react-query/queryKeys';

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export function useSyncKnockoutBracket() {
  const queryClient = useQueryClient();
  const [state, setState] = React.useState<SyncState>({ status: 'idle' });

  const run = React.useCallback(async () => {
    setState({ status: 'loading' });
    try {
      await syncQualifiedTeamsIntoKnockout();
      setState({ status: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.matches }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminResults }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminMatches })
      ]);
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Error desconocido al sincronizar el bracket'
      });
    }
  }, [queryClient]);

  const reset = React.useCallback(() => setState({ status: 'idle' }), []);

  return { state, run, reset };
}
