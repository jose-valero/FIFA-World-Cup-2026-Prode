import { CircularProgress, Stack } from '@mui/material';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth';

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Stack alignItems='center' justifyContent='center' sx={{ minHeight: '50vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!user) {
    return <Navigate to='/login' replace state={{ from: location }} />;
  }

  return <Outlet />;
}
