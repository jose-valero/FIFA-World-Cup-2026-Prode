import { Box } from '@mui/material';
import { Outlet } from 'react-router';
import AppTopNav from './AppTopNav';
import { AppFooter } from './AppFooter';
import { AppContainer } from './AppContainer';

export function PublicLayout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <AppTopNav />

      <Box component='main' sx={{ flex: 1 }}>
        <AppContainer>
          <Outlet />
        </AppContainer>
      </Box>

      <AppFooter />
    </Box>
  );
}
