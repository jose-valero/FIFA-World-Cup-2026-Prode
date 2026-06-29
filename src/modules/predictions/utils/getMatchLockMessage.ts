import type { Match } from '../../matches/types/types';

export function getMatchLockMessage(match: Match, predictionsClosed: boolean, groupStageLocked = false) {
  if (predictionsClosed) {
    return 'La carga de pronósticos está cerrada.';
  }

  if (groupStageLocked && match.stage === 'group_stage') {
    return 'Los pronósticos de fase de grupos están cerrados.';
  }

  if (match.status === 'live') {
    return 'Este partido ya está en vivo y no admite cambios.';
  }

  if (match.status === 'finished') {
    return 'Este partido ya está finalizado y no admite cambios.';
  }

  if (new Date(match.kickoffAt) <= new Date()) {
    return 'Este partido ya comenzó y no admite cambios.';
  }

  if (match.stage !== 'group_stage' && (!match.homeTeamId || !match.awayTeamId)) {
    return 'Este cruce todavía no tiene equipos definidos.';
  }

  return '';
}
