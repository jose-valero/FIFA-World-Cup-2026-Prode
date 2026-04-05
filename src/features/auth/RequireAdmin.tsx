import { CircularProgress, Stack } from '@mui/material';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from './useAuth';

export function RequireAdmin() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack alignItems='center' justifyContent='center' sx={{ minHeight: '50vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace />;
  }

  if (!profile?.is_admin) {
    return <Navigate to='/app' replace />;
  }

  return <Outlet />;
}
