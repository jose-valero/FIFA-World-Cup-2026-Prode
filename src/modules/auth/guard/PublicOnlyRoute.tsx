import { CircularProgress, Stack } from '@mui/material';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { routes } from '../../../app/router/routes';

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack alignItems='center' justifyContent='center' sx={{ minHeight: '50vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (user) {
    return <Navigate to={routes.app} replace />;
  }

  return <Outlet />;
}
