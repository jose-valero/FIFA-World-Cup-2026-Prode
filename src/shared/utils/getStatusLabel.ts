import type { Match } from '../../modules/matches/types/types';

export function getStatusLabel(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'En vivo';
    case 'finished':
      return 'Finalizado';
    case 'scheduled':
    default:
      return 'Pendiente';
  }
}
