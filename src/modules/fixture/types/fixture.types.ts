import type { MatchStatus } from '../../matches/types/types';
/** to filters */
export type GroupStageStatusFilter = '' | MatchStatus;

/** to filters */
export type FixtureViewMode = 'group_stage' | 'knockout';

export type ClientGroupStandingRow = {
  group_code: string;
  team_id: string;
  team_code: string;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank_in_group: number;
};
