import { supabase } from '../../../../lib/supabase/client';

export interface AppSettings {
  key: string;
  predictions_open: boolean;
  predictions_close_at: string | null;
  audits_visible: boolean;
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, predictions_open, predictions_close_at, audits_visible')
    .eq('key', 'global')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
// predictionsOpen: boolean;
// predictionsCloseAt: string | null;
// auditsVisible: boolean;

export async function updateAppSettings(input: Omit<AppSettings, 'key'>): Promise<void> {
  const { error } = await supabase
    .from('app_settings')
    .update({
      predictions_open: input.predictions_open,
      predictions_close_at: input.predictions_close_at,
      audits_visible: input.audits_visible
    })
    .eq('key', 'global');

  if (error) {
    throw error;
  }
}
