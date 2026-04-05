import { supabase } from '../../lib/supabase/client';

export interface AppSettings {
  key: string;
  predictions_open: boolean;
  predictions_close_at: string | null;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, predictions_open, predictions_close_at')
    .eq('key', 'global')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateAppSettings(input: {
  predictionsOpen: boolean;
  predictionsCloseAt: string | null;
}): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({
      predictions_open: input.predictionsOpen,
      predictions_close_at: input.predictionsCloseAt
    })
    .eq('key', 'global');

  if (error) {
    throw error;
  }
}
