import { createBrowserRouter, Navigate } from 'react-router';
import { PublicLayout } from '../layout/PublicLayout';
import { HomePage } from '../../modules/home/ui/HomePage';
import { AuthCallbackPage } from '../../modules/auth/ui/AuthCallbackPage';
import { PublicOnlyRoute } from '../../modules/auth/guard/PublicOnlyRoute';
import { LoginPage } from '../../modules/auth/ui/LoginPage';
import { RegisterPage } from '../../modules/auth/ui/RegisterPage';
import { RequireAuth } from '../../modules/auth/guard/RequireAuth';
import { PrivateLayout } from '../layout/PrivateLayout';
import { ParticipantLayout } from '../layout/ParticipantLayout';
import { DashboardPage } from '../../modules/dashboard/ui/DashboardPage';
import { MatchesPage } from '../../modules/predictions/ui/MatchesPage';
import { AuditPage } from '../../modules/audits/ui/AuditPage';
import { RequireAdmin } from '../../modules/auth/guard/RequireAdmin';
import { AdminMatchesPage } from '../../modules/admin/matches/ui/AdminMatchesPage';
import { AdminResultsPage } from '../../modules/admin/results/ui/AdminResultsPage';
import { AdminSettingsPage } from '../../modules/admin/settings/ui/AdminSettingsPage';
import { NotFoundPage } from '../../shared/components/NotFoundPage';
import { routes, slugs } from './routes';
import { PredictionsHubPage } from '../../modules/predictions/ui/PredictionsHubPage';
import { PredictionsPage } from '../../modules/predictions/ui/PredictionsPage';
import { LeaderboardPage } from '../../modules/leaderboard/ui/LeaderboardPage';
import { FixturePage } from '../../modules/fixture/ui/FixturePage';

export const appRouter = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: routes.home, element: <HomePage /> },
      { path: routes.leaderboard, element: <LeaderboardPage /> },
      { path: routes.auth_callback, element: <AuthCallbackPage /> }
    ]
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: routes.login, element: <LoginPage /> },
          { path: routes.register, element: <RegisterPage /> }
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
              { path: routes.dashboard, element: <DashboardPage /> },

              {
                path: routes.predictions,
                element: <PredictionsHubPage />,
                children: [
                  { index: true, element: <Navigate to='matches' replace /> },
                  { path: slugs.matches, element: <MatchesPage /> },
                  { path: slugs.my_predictions, element: <PredictionsPage /> }
                ]
              },

              { path: `${routes.app}/${slugs.matches}`, element: <Navigate to={routes.predictionMatches} replace /> },
              {
                path: `${routes.app}/${slugs.my_predictions}`,
                element: <Navigate to={routes.myPredictions} replace />
              },

              { path: routes.fixture, element: <FixturePage /> },
              { path: routes.audits, element: <AuditPage /> },

              {
                element: <RequireAdmin />,
                children: [
                  { path: routes.adminMatches, element: <AdminMatchesPage /> },
                  { path: routes.adminResults, element: <AdminResultsPage /> },
                  { path: routes.adminSettings, element: <AdminSettingsPage /> }
                ]
              }
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
