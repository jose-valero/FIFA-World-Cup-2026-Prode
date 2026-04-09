import type { TournamentStage } from '../types/stages.types';

export const stageOptions = [
  { value: 'group_stage', label: 'Fase de grupos' },
  { value: 'round_of_32', label: 'Dieciseisavos' },
  { value: 'round_of_16', label: 'Octavos de final' },
  { value: 'quarterfinals', label: 'Cuartos de final' },
  { value: 'semifinals', label: 'Semifinales' },
  { value: 'third_place', label: 'Tercer puesto' },
  { value: 'final', label: 'Final' }
] as const;

export const stageLabelMap: Record<TournamentStage, string> = {
  group_stage: 'Fase de grupos',
  round_of_32: 'Dieciseisavos',
  round_of_16: 'Octavos de final',
  quarterfinals: 'Cuartos de final',
  semifinals: 'Semifinales',
  third_place: 'Tercer puesto',
  final: 'Final'
};

export const stageOrder: TournamentStage[] = [
  'group_stage',
  'round_of_32',
  'round_of_16',
  'quarterfinals',
  'semifinals',
  'third_place',
  'final'
];
