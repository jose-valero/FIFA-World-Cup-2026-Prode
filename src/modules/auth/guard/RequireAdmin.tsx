import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { routes } from '../../../app/router/routes';
import { GuardFallback } from './GuardFallback';

export function RequireAdmin() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <GuardFallback />;
  }

  if (!user) {
    return <Navigate to={routes.login} replace />;
  }

  if (!profile?.is_admin) {
    return <Navigate to={routes.app} replace />;
  }

  return <Outlet />;
}
