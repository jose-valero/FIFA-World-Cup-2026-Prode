import { Box } from '@mui/material';
import AppTopNav from './AppTopNav';
import { AppContainer } from './AppContainer';
import { Outlet } from 'react-router';
import { AppFooter } from './AppFooter';

export const AppShellLayout = () => {
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
};
