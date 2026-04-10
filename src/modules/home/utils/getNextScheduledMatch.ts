import type { Match } from '../../matches/types/types';

export function getNextScheduledMatch(matches: Match[]) {
  const nextMatch = [...matches]
    .filter((match) => match.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())[0];

  return nextMatch ?? null;
}
