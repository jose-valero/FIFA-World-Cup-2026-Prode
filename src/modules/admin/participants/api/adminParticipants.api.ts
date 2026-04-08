import { supabase } from '../../../../lib/supabase/client';

export type AdminParticipantOverviewRow = {
  user_id: string;
  display_name: string;
  is_admin: boolean;
  is_disabled: boolean;
  email_confirmed: boolean;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
  scored_predictions: number;
};

export async function getAdminParticipantsOverview(): Promise<AdminParticipantOverviewRow[]> {
  const { data, error } = await supabase.rpc('get_admin_participants_overview');

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function setParticipantDisabled(params: { userId: string; isDisabled: boolean }) {
  const { error } = await supabase.rpc('admin_set_participant_disabled', {
    p_user_id: params.userId,
    p_is_disabled: params.isDisabled
  });

  if (error) {
    throw error;
  }
}
