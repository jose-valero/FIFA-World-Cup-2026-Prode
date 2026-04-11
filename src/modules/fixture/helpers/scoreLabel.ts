import type { Match } from '../../matches/types/types';

export function scoreLabel(match: Match) {
  if (match.officialHomeScore === null || match.officialAwayScore === null) {
    return null;
  }

  return `${match.officialHomeScore} - ${match.officialAwayScore}`;
}
