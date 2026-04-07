import type { PredictionView } from '../types/predictions.types';

export function getPredictionViewFromPath(pathname: string): PredictionView {
  if (pathname.includes('/my-predictions')) {
    return 'my-predictions';
  }

  return 'matches';
}
