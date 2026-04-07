export function buildPredictionSummary(prediction?: { homeScore: number; awayScore: number }) {
  if (!prediction) return null;
  return `${prediction.homeScore} - ${prediction.awayScore}`;
}
