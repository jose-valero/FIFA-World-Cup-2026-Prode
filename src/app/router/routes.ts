export const slugs = {
  audits: 'audits',
  callback: 'callback',
  dashboard: 'dashboard',
  fixture: 'fixture',
  matches: 'matches',
  my_predictions: 'my-predictions',
  predictions: 'predictions',
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
  fixture: `/app/${slugs.fixture}`,
  audits: `/app/${slugs.audits}`,

  adminMatches: `/admin/${slugs.matches}`,
  adminResults: `/admin/${slugs.results}`,
  adminSettings: `/admin/${slugs.settings}`
} as const;
