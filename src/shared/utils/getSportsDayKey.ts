// Sports day boundary: 06:00 local. Matches between 00:00–05:59 belong to the previous day's matchday.
export function getSportsDayKey(date: Date): string {
  const adjusted = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  return adjusted.toDateString();
}
