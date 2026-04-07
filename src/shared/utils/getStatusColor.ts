import type { Match } from '../types';

export function getStatusColor(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'scheduled':
    default:
      return 'warning';
  }
}
