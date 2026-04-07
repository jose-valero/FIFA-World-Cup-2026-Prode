import { Navigate, Route, Routes } from 'react-router';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/DashboardPage';
import { MatchesPage } from './pages/MatchesPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { PublicLayout } from './components/layout/PublicLayout';
import { PrivateLayout } from './components/layout/PrivateLayout';
import { ParticipantLayout } from './components/layout/ParticipantLayout';
import { PublicOnlyRoute } from './features/auth/PublicOnlyRoute';
import { RequireAuth } from './features/auth/RequireAuth';
import { AdminResultsPage } from './pages/AdminResultsPage';
import { RequireAdmin } from './features/auth/RequireAdmin';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminMatchesPage } from './pages/AdminMatchesPage';
import { FixturePage } from './pages/FixturePage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AuditPage } from './pages/AuditPage';
import { PredictionsHubPage } from './pages/PredictionsHubPage';

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path='/' element={<HomePage />} />
        <Route path='/ranking' element={<LeaderboardPage />} />
        <Route path='/leaderboard' element={<Navigate to='/ranking' replace />} />
        <Route path='/auth/callback' element={<AuthCallbackPage />} />
      </Route>

      <Route element={<PublicOnlyRoute />}>
        <Route element={<PublicLayout />}>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<PrivateLayout />}>
          <Route element={<ParticipantLayout />}>
            <Route path='/app' element={<Navigate to='/app/dashboard' replace />} />
            <Route path='/app/dashboard' element={<DashboardPage />} />

            <Route path='/app/predictions' element={<PredictionsHubPage />}>
              <Route index element={<Navigate to='/app/predictions/matches' replace />} />
              <Route path='matches' element={<MatchesPage />} />
              <Route path='my-predictions' element={<PredictionsPage />} />
            </Route>

            <Route path='/app/matches' element={<Navigate to='/app/predictions/matches' replace />} />
            <Route path='/app/my-predictions' element={<Navigate to='/app/predictions/my-predictions' replace />} />

            <Route path='/app/fixture' element={<FixturePage />} />
            <Route path='/app/audits' element={<AuditPage />} />

            <Route path='/app/leaderboard' element={<Navigate to='/ranking' replace />} />

            <Route element={<RequireAdmin />}>
              <Route path='/admin/matches' element={<AdminMatchesPage />} />
              <Route path='/admin/results' element={<AdminResultsPage />} />
              <Route path='/admin/settings' element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path='*' element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
