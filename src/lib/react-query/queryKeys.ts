export const queryKeys = {
  matches: ['matches'] as const,
  leaderboard: ['leaderboard'] as const,
  appSettings: ['app-settings'] as const,
  teams: ['teams'] as const,
  adminMatches: ['admin-matches'] as const,
  adminResults: ['admin-results'] as const,
  predictions: (userId: string) => ['predictions', userId] as const
};
