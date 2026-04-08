import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';

import { PublicLayout } from '../layout/PublicLayout';
import { PrivateLayout } from '../layout/PrivateLayout';
import { ParticipantLayout } from '../layout/ParticipantLayout';

import { PublicOnlyRoute } from '../../modules/auth/guard/PublicOnlyRoute';
import { RequireAuth } from '../../modules/auth/guard/RequireAuth';
import { RequireAdmin } from '../../modules/auth/guard/RequireAdmin';
import { RequireEnabledParticipant } from '../../modules/auth/guard/RequireEnabledParticipant';

import { routes, slugs } from './routes';
import { NotFoundPage } from '../../shared/components/NotFoundPage';
import { RouteFallback } from '../../shared/components/RouteFallback';

const HomePage = lazy(() =>
  import('../../modules/home/ui/HomePage').then((module) => ({
    default: module.HomePage
  }))
);

const LeaderboardPage = lazy(() =>
  import('../../modules/leaderboard/ui/LeaderboardPage').then((module) => ({
    default: module.LeaderboardPage
  }))
);

const AuthCallbackPage = lazy(() =>
  import('../../modules/auth/ui/AuthCallbackPage').then((module) => ({
    default: module.AuthCallbackPage
  }))
);

const LoginPage = lazy(() =>
  import('../../modules/auth/ui/LoginPage').then((module) => ({
    default: module.LoginPage
  }))
);

const RegisterPage = lazy(() =>
  import('../../modules/auth/ui/RegisterPage').then((module) => ({
    default: module.RegisterPage
  }))
);

const DashboardPage = lazy(() =>
  import('../../modules/dashboard/ui/DashboardPage').then((module) => ({
    default: module.DashboardPage
  }))
);

const PredictionsHubPage = lazy(() =>
  import('../../modules/predictions/ui/PredictionsHubPage').then((module) => ({
    default: module.PredictionsHubPage
  }))
);

const MatchesPage = lazy(() =>
  import('../../modules/predictions/ui/MatchesPage').then((module) => ({
    default: module.MatchesPage
  }))
);

const PredictionsPage = lazy(() =>
  import('../../modules/predictions/ui/PredictionsPage').then((module) => ({
    default: module.PredictionsPage
  }))
);

const FixturePage = lazy(() =>
  import('../../modules/fixture/ui/FixturePage').then((module) => ({
    default: module.FixturePage
  }))
);

const AdminMatchesPage = lazy(() =>
  import('../../modules/admin/matches/ui/AdminMatchesPage').then((module) => ({
    default: module.AdminMatchesPage
  }))
);

const AdminResultsPage = lazy(() =>
  import('../../modules/admin/results/ui/AdminResultsPage').then((module) => ({
    default: module.AdminResultsPage
  }))
);

const AdminSettingsPage = lazy(() =>
  import('../../modules/admin/settings/ui/AdminSettingsPage').then((module) => ({
    default: module.AdminSettingsPage
  }))
);

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const appRouter = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: routes.home, element: withSuspense(<HomePage />) },
      {
        element: <RequireEnabledParticipant />,
        children: [{ path: routes.leaderboard, element: withSuspense(<LeaderboardPage />) }]
      },
      { path: routes.auth_callback, element: withSuspense(<AuthCallbackPage />) }
    ]
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: routes.login, element: withSuspense(<LoginPage />) },
          { path: routes.register, element: withSuspense(<RegisterPage />) }
        ]
      }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <PrivateLayout />,
        children: [
          {
            element: <ParticipantLayout />,
            children: [
              { path: routes.app, element: <Navigate to={routes.dashboard} replace /> },

              {
                element: <RequireEnabledParticipant />,
                children: [
                  { path: routes.dashboard, element: withSuspense(<DashboardPage />) },

                  {
                    path: routes.predictions,
                    element: withSuspense(<PredictionsHubPage />),
                    children: [
                      { index: true, element: <Navigate to={slugs.matches} replace /> },
                      { path: slugs.matches, element: withSuspense(<MatchesPage />) },
                      { path: slugs.my_predictions, element: withSuspense(<PredictionsPage />) }
                    ]
                  },

                  {
                    path: `${routes.app}/${slugs.matches}`,
                    element: <Navigate to={routes.predictionMatches} replace />
                  },
                  {
                    path: `${routes.app}/${slugs.my_predictions}`,
                    element: <Navigate to={routes.myPredictions} replace />
                  },

                  {
                    element: <RequireAdmin />,
                    children: [
                      { path: routes.adminMatches, element: withSuspense(<AdminMatchesPage />) },
                      { path: routes.adminResults, element: withSuspense(<AdminResultsPage />) },
                      { path: routes.adminSettings, element: withSuspense(<AdminSettingsPage />) }
                    ]
                  }
                ]
              },

              { path: routes.fixture, element: withSuspense(<FixturePage />) }
            ]
          }
        ]
      }
    ]
  },
  {
    element: <PublicLayout />,
    children: [{ path: '*', element: <NotFoundPage /> }]
  }
]);
