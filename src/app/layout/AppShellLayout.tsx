import { Box } from '@mui/material';
import AppTopNav from './AppTopNav';
import { AppContainer } from './AppContainer';
import { Outlet } from 'react-router';
import { AppFooter } from './AppFooter';
import { AppBottomNav } from './AppBottomNav';

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

      {/* Footer solo en desktop — en mobile lo reemplaza la BottomNav */}
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <AppFooter />
      </Box>

      {/* Espacio reservado para la BottomNav fija en mobile */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, height: 64, flexShrink: 0 }} />

      <AppBottomNav />
    </Box>
  );
};
