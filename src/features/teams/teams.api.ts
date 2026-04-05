import { supabase } from '../../lib/supabase/client';

export interface TeamRow {
  id: string;
  code: string | null;
  name: string;
  short_name: string | null;
}

export async function getTeams(): Promise<TeamRow[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, code, name, short_name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
