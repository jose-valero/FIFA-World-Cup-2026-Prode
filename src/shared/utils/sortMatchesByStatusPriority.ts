import type { Match } from '../../modules/matches/types/types';
import type { PredictionWithMatch } from '../../modules/predictions/ui/PredictionsPage';
import { getEffectiveMatchStatus } from './getEffectiveMatchStatus';

function getEffectiveStatusPriority(match: Match): number {
  switch (getEffectiveMatchStatus(match)) {
    case 'scheduled': return 0;
    case 'live': return 1;
    case 'finished': return 2;
    default: return 99;
  }
}

export function sortMatchesByStatusPriority<T extends Match>(matches: T[]) {
  return [...matches].sort((a, b) => {
    const byStatus = getEffectiveStatusPriority(a) - getEffectiveStatusPriority(b);
    if (byStatus !== 0) return byStatus;
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

export function sortPredictionItems(items: PredictionWithMatch[]) {
  return [...items].sort((a, b) => {
    const aPriority = a.match ? getEffectiveStatusPriority(a.match) : 99;
    const bPriority = b.match ? getEffectiveStatusPriority(b.match) : 99;
    const byStatus = aPriority - bPriority;
    if (byStatus !== 0) return byStatus;
    const aTime = a.match ? new Date(a.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.match ? new Date(b.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}
