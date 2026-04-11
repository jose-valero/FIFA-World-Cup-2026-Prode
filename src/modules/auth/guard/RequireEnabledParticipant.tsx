import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { routes } from '../../../app/router/routes';
import { GuardFallback } from './GuardFallback';

export function RequireEnabledParticipant() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return <GuardFallback />;
  }

  if (!user) {
    return <Outlet />;
  }

  if (profile?.is_disabled) {
    return <Navigate to={routes.home} replace />;
  }

  return <Outlet />;
}
