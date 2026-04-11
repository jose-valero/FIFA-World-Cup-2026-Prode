import type { Match } from '../../modules/matches/types/types';
import type { PredictionWithMatch } from '../../modules/predictions/ui/PredictionsPage';

function getStatusPriority(status: Match['status']) {
  switch (status) {
    case 'scheduled':
      return 0;
    case 'live':
      return 1;
    case 'finished':
      return 2;
    default:
      return 99;
  }
}

export function sortMatchesByStatusPriority<T extends Match>(matches: T[]) {
  return [...matches].sort((a, b) => {
    const byStatus = getStatusPriority(a.status) - getStatusPriority(b.status);

    if (byStatus !== 0) {
      return byStatus;
    }

    return 0;
  });
}

// para Predictions page, luego arreglamos los tipos para que confluya todo
function getMatchStatusPriority(match: Match | null) {
  if (!match) return 99;

  switch (match.status) {
    case 'scheduled':
      return 0;
    case 'live':
      return 1;
    case 'finished':
      return 2;
    default:
      return 99;
  }
}

export function sortPredictionItems(items: PredictionWithMatch[]) {
  return [...items].sort((a, b) => {
    const byStatus = getMatchStatusPriority(a.match) - getMatchStatusPriority(b.match);

    if (byStatus !== 0) {
      return byStatus;
    }

    const aTime = a.match ? new Date(a.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.match ? new Date(b.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;

    return aTime - bTime;
  });
}
