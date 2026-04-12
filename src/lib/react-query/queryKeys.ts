export const queryKeys = {
  myProfile: (userId: string) => ['auth', 'profile', userId] as const,
  matches: ['matches'] as const,
  leaderboard: ['leaderboard'] as const,
  appSettings: ['app-settings'] as const,
  teams: ['teams'] as const,
  adminMatches: ['admin-matches'] as const,
  adminResults: ['admin-results'] as const,
  auditPredictions: ['audit-predictions'] as const,
  auditPredictionsByUser: (userId: string) => ['audit-predictions', 'user', userId] as const,
  predictions: (userId: string) => ['predictions', userId] as const,
  adminParticipantsOverview: ['admin-participants-overview'],
  topThreeAvatars: (userIds: string[]) => ['top-three-avatars', ...userIds.sort()] as const
};
