import type { Match, MatchStatus } from '../../matches/types/types';
import { getEffectiveMatchStatus } from '../../../shared/utils/getEffectiveMatchStatus';

const STATUS_ORDER: Record<MatchStatus, number> = { live: 0, scheduled: 1, finished: 2 };

export function sortScrollerMatches(matches: Match[]): Match[] {
  return [...matches].sort((a, b) => {
    const statusDiff = STATUS_ORDER[getEffectiveMatchStatus(a)] - STATUS_ORDER[getEffectiveMatchStatus(b)];
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}
