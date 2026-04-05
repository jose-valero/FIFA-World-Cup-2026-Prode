import { Box, Container, Divider, Link as MuiLink, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
export function AppFooter() {
  return (
    <Box component='footer' sx={{ mt: 'auto' }}>
      <Divider />

      <Container maxWidth='lg' sx={{ py: 3 }}>
        <Stack spacing={2} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Box>
            <Typography variant='subtitle1' fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              Quiniela Mundial de la FIFA 2026
              <SportsSoccerIcon />
            </Typography>

            <Typography variant='body2' color='text.secondary'>
              Quiniela privada del Mundial FIFA 2026 para competir entre amigos y seguir el torneo partido a partido.
            </Typography>

            {/* <Typography variant='body2' color='text.secondary'>
              Proyecto personal para mis amigos, homosexuales, lesbianas, gente depravada, cegada por satanás seducidas
              por la concupiscencia de sus corazones
            </Typography> */}
          </Box>

          <Stack direction='row' spacing={2} flexWrap='wrap' useFlexGap>
            <MuiLink component={RouterLink} to='/' underline='hover' color='inherit'>
              Inicio
            </MuiLink>

            <MuiLink component={RouterLink} to='/login' underline='hover' color='inherit'>
              Login
            </MuiLink>

            <MuiLink component={RouterLink} to='/register' underline='hover' color='inherit'>
              Registro
            </MuiLink>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
