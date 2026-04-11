import { Paper, Stack, Typography, alpha, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router';

export const HomeFooter = () => {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        p: { xs: 3, md: 4 },
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.2),
        textAlign: { xs: 'left', md: 'center' }
      })}
    >
      <Stack spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
        <Typography variant='h4' fontWeight={900}>
          ¿Listo para entrar a competir?
        </Typography>

        <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 760, lineHeight: 1.75 }}>
          Crea tu cuenta, carga tus predicciones antes del cierre y compite por quedar en lo más alto del ranking global
          del Mundial 2026.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            component={RouterLink}
            to='/register'
            variant='contained'
            size='large'
            sx={{
              minWidth: { xs: '100%', sm: 240 },
              minHeight: 50,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 800
            }}
          >
            Registrarme ahora
          </Button>

          <Button
            component={RouterLink}
            to='/login'
            variant='outlined'
            size='large'
            sx={{
              minWidth: { xs: '100%', sm: 220 },
              minHeight: 50,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 800
            }}
          >
            Ya tengo cuenta
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};
