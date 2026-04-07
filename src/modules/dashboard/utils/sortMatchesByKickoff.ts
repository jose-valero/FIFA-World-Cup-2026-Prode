import type { Match } from '../../matches/types/types';

export function sortMatchesByKickoff(matches: Match[]) {
  return [...matches].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}
