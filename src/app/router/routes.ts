export const slugs = {
  callback: 'callback',
  dashboard: 'dashboard',
  fixture: 'fixture',
  matches: 'matches',
  my_predictions: 'my-predictions',
  predictions: 'predictions',
  profile: 'profile',
  results: 'results',
  settings: 'settings'
} as const;

export const routes = {
  home: '/',
  leaderboard: '/leaderboard',
  login: '/login',
  register: '/register',
  auth_callback: `/auth/${slugs.callback}`,
  app: '/app',

  dashboard: `/app/${slugs.dashboard}`,
  predictions: `/app/${slugs.predictions}`,
  predictionMatches: `/app/${slugs.predictions}/${slugs.matches}`,
  myPredictions: `/app/${slugs.predictions}/${slugs.my_predictions}`,
  profile: `/app/${slugs.profile}`,
  fixture: `/app/${slugs.fixture}`,
  adminMatches: `/admin/${slugs.matches}`,
  adminResults: `/admin/${slugs.results}`,
  adminSettings: `/admin/${slugs.settings}`
} as const;
