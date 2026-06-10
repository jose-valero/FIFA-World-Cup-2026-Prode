import * as React from 'react';
import { useAuth } from '../../../auth/hooks/useAuth';

type SyncChange = {
  match_id: string;
  espn_event_id: string;
  before: { status: string; home_score: number | null; away_score: number | null };
  after: { status: string; home_score: number | null; away_score: number | null };
};

type SyncOmission = {
  match_id: string;
  espn_event_id: string;
  reason: string;
};

export type SyncResult = {
  total_reviewed: number;
  total_updated: number;
  total_unchanged: number;
  total_omitted: number;
  changes: SyncChange[];
  omissions?: SyncOmission[];
};

type SyncState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: SyncResult }
  | { status: 'error'; message: string };

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export function useSyncESPNMatches() {
  const { session } = useAuth();
  const [state, setState] = React.useState<SyncState>({ status: 'idle' });

  const run = React.useCallback(async () => {
    if (!session?.access_token) return;

    setState({ status: 'loading' });

    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/admin/sync-espn-matches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
      }

      const data = (await res.json()) as SyncResult;
      setState({ status: 'success', result: data });
    } catch (e) {
      setState({
        status: 'error',
        message: e instanceof Error ? e.message : 'Error desconocido'
      });
    }
  }, [session?.access_token]);

  const reset = React.useCallback(() => setState({ status: 'idle' }), []);

  return { state, run, reset };
}
