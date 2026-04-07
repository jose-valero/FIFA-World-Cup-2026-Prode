import { supabase } from '../../../lib/supabase/client';
import type { AuthProfile } from '../types/auth.types';

export async function getMyProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, is_admin')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
