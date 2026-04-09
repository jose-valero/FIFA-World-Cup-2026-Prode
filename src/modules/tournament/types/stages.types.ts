import type { Match } from '../../matches/types/types';
import type { stageOptions } from '../constants/stages.const';

export type TournamentStage = (typeof stageOptions)[number]['value'];

export type GroupStandingRow = {
  groupCode: string;
  teamId: string;
  teamCode: string | null;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  rankInGroup: number;
};

export type TemplateSource =
  | {
      type: 'group_position';
      groupCode: string;
      groupRank: number;
    }
  | {
      type: 'best_third_place';
      groupSet: string;
    }
  | {
      type: 'match_winner' | 'match_loser';
      matchId: string;
    };

export type ResolvedTeam = {
  name: string;
  code: string | null;
};

export interface StageGroup {
  stage: TournamentStage;
  matches: Match[];
}
