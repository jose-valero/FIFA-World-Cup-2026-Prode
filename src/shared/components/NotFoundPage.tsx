import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import SportsSoccerRoundedIcon from '@mui/icons-material/SportsSoccerRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Box, Button, Card, CardContent, Stack, Typography, alpha } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router';
import { routes } from '../../app/router/routes';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={() => ({
        minHeight: 'calc(100vh - 180px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 8 }
      })}
    >
      <Card
        elevation={0}
        sx={(theme) => ({
          width: '100%',
          maxWidth: 760,
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.08),
          background:
            theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`
              : theme.palette.background.paper,
          boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.18)}`,
          overflow: 'hidden'
        })}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
          <Stack spacing={3} alignItems='center' textAlign='center'>
            <Box
              sx={(theme) => ({
                width: 96,
                height: 96,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: `radial-gradient(circle, ${alpha(theme.palette.warning.main, 0.18)} 0%, ${alpha(
                  theme.palette.warning.main,
                  0.06
                )} 55%, transparent 100%)`
              })}
            >
              <SportsSoccerRoundedIcon sx={{ fontSize: 44, color: 'warning.main' }} />
            </Box>

            <Stack spacing={1.25} alignItems='center'>
              <Typography
                variant='h2'
                sx={{
                  fontWeight: 900,
                  lineHeight: 1,
                  fontSize: { xs: '3.5rem', sm: '4.5rem' }
                }}
              >
                404
              </Typography>

              <Typography
                variant='h4'
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                Esta página no existe
              </Typography>

              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 520 }}>
                Puede que el enlace esté roto, que la ruta haya cambiado o que la página ya no esté disponible.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ width: '100%', justifyContent: 'center', pt: 1 }}
            >
              <Button
                variant='contained'
                size='large'
                component={RouterLink}
                to={routes.home}
                startIcon={<HomeRoundedIcon />}
                sx={{ minWidth: 180, borderRadius: 999 }}
              >
                Ir al inicio
              </Button>

              <Button
                variant='outlined'
                size='large'
                component={RouterLink}
                to={routes.fixture}
                startIcon={<SportsSoccerRoundedIcon />}
                sx={{ minWidth: 180, borderRadius: 999 }}
              >
                Ver fixture
              </Button>

              <Button
                variant='text'
                size='large'
                onClick={() => navigate(-1)}
                startIcon={<ArrowBackRoundedIcon />}
                sx={{ minWidth: 180, borderRadius: 999 }}
              >
                Volver atrás
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
