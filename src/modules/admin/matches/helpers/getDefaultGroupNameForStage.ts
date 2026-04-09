import type { TournamentStage } from '../../../tournament/types/stages.types';
import { getStageLabel } from '../../../tournament/utils/getStageLabel';

export function getDefaultGroupNameForStage(stage: TournamentStage) {
  return stage === 'group_stage' ? 'Grupo A' : getStageLabel(stage);
}
