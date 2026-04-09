import type { TournamentStage } from '../types/stages.types';
import { stageLabelMap } from '../constants/stages.const';

export function getStageLabel(stage: TournamentStage) {
  return stageLabelMap[stage];
}
