import type { Match } from '../../modules/matches/types/types';

export function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}
