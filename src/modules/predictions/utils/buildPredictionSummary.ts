const TIEBREAK_LABEL: Record<string, string> = {
  extra_time: 'PT',
  penalties: 'PEN'
};

export function buildPredictionSummary(prediction?: {
  homeScore: number;
  awayScore: number;
  knockoutTiebreak?: string | null;
  knockoutWinner?: string | null;
} | null) {
  if (!prediction) return null;

  const base = `${prediction.homeScore} - ${prediction.awayScore}`;

  if (prediction.knockoutTiebreak && prediction.knockoutWinner) {
    const method = TIEBREAK_LABEL[prediction.knockoutTiebreak] ?? prediction.knockoutTiebreak;
    return `${base} (${method})`;
  }

  return base;
}
