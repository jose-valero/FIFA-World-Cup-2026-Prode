import type { MatchDetailPayload } from '../types/matchDetail.types';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export async function getMatchDetail(matchId: string): Promise<MatchDetailPayload> {
  const response = await fetch(`${BACKEND_URL}/api/v1/matches/${matchId}/detail`);

  if (response.status === 404) {
    throw new Error('Partido no encontrado');
  }

  if (!response.ok) {
    throw new Error(`Error al cargar el detalle del partido (${response.status})`);
  }

  return response.json() as Promise<MatchDetailPayload>;
}
