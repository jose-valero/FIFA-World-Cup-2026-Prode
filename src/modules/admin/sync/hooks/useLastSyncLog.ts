import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../../lib/supabase/client';

export type SyncLog = {
  id: number;
  created_at: string;
  trigger_source: string;
  total_reviewed: number;
  total_updated: number;
  total_unchanged: number;
  total_omitted: number;
  duration_ms: number;
  status: 'success' | 'error';
  error_message: string | null;
};

async function fetchLastSyncLog(): Promise<SyncLog | null> {
  const { data, error } = await supabase
    .from('sync_logs')
    .select('id,created_at,trigger_source,total_reviewed,total_updated,total_unchanged,total_omitted,duration_ms,status,error_message')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as SyncLog | null;
}

export function useLastSyncLog() {
  return useQuery({
    queryKey: ['sync_logs', 'last'],
    queryFn: fetchLastSyncLog,
    refetchInterval: 60_000,
    staleTime: 30_000
  });
}
