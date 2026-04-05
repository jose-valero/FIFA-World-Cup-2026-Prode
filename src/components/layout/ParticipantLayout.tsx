import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../../features/auth/useAuth';

const participantNavItems = [
  { label: 'Resumen', to: '/app' },
  { label: 'Partidos', to: '/app/matches' },
  { label: 'Mis pronósticos', to: '/app/predictions' }
];

const adminNavItems = [
  { label: 'Admin · Partidos', to: '/admin/matches' },
  { label: 'Admin · Resultados', to: '/admin/results' },
  { label: 'Admin · Configuración', to: '/admin/settings' }
];

function getDisplayName(user: any) {
  const metadataName = user?.user_metadata?.display_name || user?.user_metadata?.displayName;

  if (metadataName && typeof metadataName === 'string') return metadataName;
  if (user?.email && typeof user.email === 'string') return user.email.split('@')[0];

  return 'Usuario';
}

export function ParticipantLayout() {
  const { user, profile } = useAuth();
  const displayName = getDisplayName(user);
  const isAdmin = Boolean(profile?.is_admin);

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={3}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography variant='h4' fontWeight={800}>
                  Panel del participante
                </Typography>

                <Typography color='text.secondary' sx={{ mt: 1 }}>
                  Bienvenido, {displayName}.
                </Typography>
              </Box>

              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label='Fase: Grupos' color='primary' variant='outlined' />
                <Chip label='Pronósticos abiertos' color='success' />
                {isAdmin ? <Chip label='Admin' color='warning' /> : null}
              </Stack>
            </Stack>

            <Stack spacing={1.5}>
              <Typography variant='overline' color='text.secondary'>
                Navegación principal
              </Typography>

              <Stack direction='row' spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                {participantNavItems.map((item) => (
                  <Button
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    end={item.to === '/app'}
                    variant='text'
                    sx={{
                      flexShrink: 0,
                      borderRadius: 999,
                      px: 2,
                      py: 1,
                      fontWeight: 700,
                      color: 'text.secondary',
                      '&.active': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText'
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            </Stack>

            {isAdmin ? (
              <>
                <Divider />

                <Stack spacing={1.5}>
                  <Typography variant='overline' color='text.secondary'>
                    Herramientas de administración
                  </Typography>

                  <Stack direction='row' spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                    {adminNavItems.map((item) => (
                      <Button
                        key={item.to}
                        component={NavLink}
                        to={item.to}
                        variant='outlined'
                        sx={{
                          flexShrink: 0,
                          borderRadius: 999,
                          px: 2,
                          py: 1,
                          fontWeight: 700,
                          '&.active': {
                            borderColor: 'warning.main',
                            color: 'warning.main',
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Outlet />
    </Stack>
  );
}
