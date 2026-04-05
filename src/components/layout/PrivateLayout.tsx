import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router';
import AppTopNav from '../navigation/AppTopNav';
import { AppFooter } from './AppFooter';

export function PrivateLayout() {
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
        <Container maxWidth='lg' sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
          <Outlet />
        </Container>
      </Box>
      <AppFooter />
    </Box>
  );
}
