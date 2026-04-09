import type { TemplateSource } from '../types/stages.types';

export const gp = (groupCode: string, groupRank: number): TemplateSource => ({
  type: 'group_position',
  groupCode,
  groupRank
});

export const third = (groupSet: string): TemplateSource => ({
  type: 'best_third_place',
  groupSet
});

export const winner = (matchId: string): TemplateSource => ({
  type: 'match_winner',
  matchId
});

export const loser = (matchId: string): TemplateSource => ({
  type: 'match_loser',
  matchId
});
