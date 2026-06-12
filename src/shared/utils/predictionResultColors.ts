export type PredictionResult = 'exact' | 'sign' | 'miss';

export const PREDICTION_RESULT_CONFIG = [
  { key: 'exact' as PredictionResult, label: 'Exacto',  color: 'secondary.dark' },
  { key: 'sign'  as PredictionResult, label: 'Acierto', color: 'primary.main' },
  { key: 'miss'  as PredictionResult, label: 'Fallo',   color: 'error.main' }
] as const;

export function getPredictionResultColor(result: PredictionResult): string {
  return PREDICTION_RESULT_CONFIG.find((c) => c.key === result)!.color;
}
