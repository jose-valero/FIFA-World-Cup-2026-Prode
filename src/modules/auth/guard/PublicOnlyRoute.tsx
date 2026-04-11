import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { routes } from '../../../app/router/routes';
import { GuardFallback } from './GuardFallback';

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <GuardFallback />;
  }

  if (user) {
    return <Navigate to={routes.app} replace />;
  }

  return <Outlet />;
}
