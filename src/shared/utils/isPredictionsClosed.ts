export function isPredictionsClosed(predictionsOpen: boolean, predictionsCloseAt: string | null) {
  if (!predictionsOpen) return true;
  if (!predictionsCloseAt) return false;

  return new Date(predictionsCloseAt).getTime() <= Date.now();
}
