import type { LeaderboardRow } from '../types/leaderboard.types';

/**
 * Assigns competition ranks to active (non-disabled) rows.
 * Two rows are tied when they share total_points and exact_hits.
 * display_name is visual-only and does not break a tie.
 * Example result: [100pts/5ex, 100pts/5ex, 90pts/3ex] → ranks 1, 1, 3
 */
export function buildLeaderboardRanks(rows: LeaderboardRow[]): Map<string, number> {
  const rankMap = new Map<string, number>();
  let rank = 1;

  for (let i = 0; i < rows.length; i++) {
    if (i > 0) {
      const prev = rows[i - 1];
      const curr = rows[i];
      const tied =
        prev.total_points === curr.total_points && prev.exact_hits === curr.exact_hits;
      if (!tied) rank = i + 1;
    }
    rankMap.set(rows[i].user_id, rank);
  }

  return rankMap;
}
