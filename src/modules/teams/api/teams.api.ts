import { supabase } from '../../../lib/supabase/client';
import type { TeamCatalogItem, TeamDetail } from '../types/teams.types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '');

export async function getTeamsCatalog(): Promise<TeamCatalogItem[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, code, name, short_name')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getTeamCatalogById(teamId: string): Promise<TeamCatalogItem | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, code, name, short_name')
    .eq('id', teamId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function getTeamDetail(teamId: string): Promise<TeamDetail | null> {
  if (!BACKEND_URL) {
    throw new Error('Falta configurar VITE_BACKEND_URL');
  }

  const response = await fetch(`${BACKEND_URL}/api/v1/teams/${teamId}/detail`, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('No se pudo cargar el detalle del equipo');
  }

  const data = (await response.json()) as TeamDetail;
  return data;
}
