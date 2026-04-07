import type { Match } from '../../matches/types/types';

export function getMatchLockMessage(match: Match, predictionsClosed: boolean) {
  if (predictionsClosed) {
    return 'La carga de pronósticos está cerrada.';
  }

  if (match.status === 'live') {
    return 'Este partido ya está en vivo y no admite cambios.';
  }

  if (match.status === 'finished') {
    return 'Este partido ya está finalizado y no admite cambios.';
  }

  return '';
}
