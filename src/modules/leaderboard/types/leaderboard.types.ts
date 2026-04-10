import type { Match } from '../../matches/types/types';

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
  scored_predictions: number;
  is_disabled: boolean;
}

export interface MatchLeaderboard {
  matches: Match[];
  leaderboard: LeaderboardRow[];
}
