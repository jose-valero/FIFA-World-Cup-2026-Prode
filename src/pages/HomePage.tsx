import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { CompetitionStatusCard } from '../features/settings/components/CompetitionStatusCard';

const howItWorks = [
  {
    title: '1. Regístrate',
    description: 'Crea tu cuenta en pocos pasos y entra a la quiniela.'
  },
  {
    title: '2. Carga tus pronósticos',
    description: 'Predice los resultados de los partidos de la fase de grupos.'
  },
  {
    title: '3. Compite en el ranking',
    description: 'Suma puntos por tus aciertos y sube en la tabla global.'
  }
];

const scoringRules = [
  {
    title: 'Acierto ganador o empate',
    points: '+3 pts',
    description: 'Ganas puntos si aciertas el signo del partido.'
  },
  {
    title: 'Marcador exacto',
    points: '+2 pts',
    description: 'Recibes puntos extra si aciertas el resultado exacto.'
  },
  {
    title: 'Resultado exacto total',
    points: '5 pts',
    description: 'Si pegas el marcador completo, sumas 5 puntos en total.'
  }
];

const leaderboardPreview = [
  { position: 1, name: 'jose valero', points: 24 },
  { position: 2, name: 'jose miguel valero', points: 21 },
  { position: 3, name: 'jose miguel valero reyes', points: 19 },
  { position: 4, name: 'jv', points: 17 },
  { position: 5, name: 'jmvr', points: 15 }
];

export function HomePage() {
  return (
    <Box component='section'>
      <Container maxWidth='lg'>
        <Stack spacing={4} /* sx={{ py: { xs: 4, md: 4 } }} */>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4, md: 6 },
              borderRadius: 4
            }}
          >
            <Stack spacing={3} sx={{ maxWidth: 760 }}>
              <Stack spacing={2}>
                <Typography
                  color='primary.dark'
                  variant='h1'
                  sx={{
                    fontSize: { xs: '2rem', sm: '3rem', md: '4rem' },
                    lineHeight: 1.05,
                    fontWeight: 800,
                    letterSpacing: '-0.03em'
                  }}
                >
                  Quiniela Mundial 2026
                </Typography>

                <Typography
                  variant='body1'
                  color='text.secondary'
                  sx={{
                    maxWidth: 680,
                    fontSize: { xs: '1rem', md: '1.125rem' },
                    lineHeight: 1.7
                  }}
                >
                  Pronostica los partidos de la fase de grupos, suma puntos por tus aciertos y compite en una tabla
                  global con todos los participantes.
                </Typography>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1, width: '100%', maxWidth: 420 }}>
                <Button
                  component={RouterLink}
                  to='/register'
                  variant='contained'
                  size='large'
                  fullWidth
                  sx={{
                    minHeight: 48,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  Crear cuenta
                </Button>

                <Button
                  component={RouterLink}
                  to='/leaderboard'
                  variant='outlined'
                  size='large'
                  fullWidth
                  sx={{
                    minHeight: 48,
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 700
                  }}
                >
                  Ver ranking
                </Button>
              </Stack>

              {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap flexWrap='wrap' sx={{ pt: 1 }}>
                <Chip label='Pronósticos abiertos' color='success' />
                <Chip label='Fase actual: Grupos' variant='outlined' color={'success'} />
                <Chip label='Cierre: 5 días antes del Mundial' variant='outlined' color={'success'} />
              </Stack> */}
            </Stack>
          </Paper>
          <CompetitionStatusCard />

          <Box>
            <Typography variant='h4' fontWeight={800} gutterBottom>
              ¿Cómo funciona?
            </Typography>

            <Grid container spacing={2}>
              {howItWorks.map((item) => (
                <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={1.5}>
                        <Typography variant='h6' fontWeight={700}>
                          {item.title}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
                          {item.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Typography variant='h4' fontWeight={800} gutterBottom>
              Sistema de puntos
            </Typography>

            <Grid container spacing={2}>
              {scoringRules.map((rule) => (
                <Grid key={rule.title} size={{ xs: 12, md: 4 }}>
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack spacing={0.5}>
                          <Typography variant='h6' fontWeight={700}>
                            {rule.title}
                          </Typography>
                          <Typography variant='h4' color='primary' sx={{ fontWeight: 800, letterSpacing: '-0.03em' }}>
                            {rule.points}
                          </Typography>
                        </Stack>

                        <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.7 }}>
                          {rule.description}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Typography variant='h5' fontWeight={800}>
                      Estado de la quiniela
                    </Typography>

                    <Stack spacing={1.25}>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Estado
                        </Typography>
                        <Typography fontWeight={700}>Abierta</Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Etapa
                        </Typography>
                        <Typography fontWeight={700}>Fase de grupos</Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Cierre de pronósticos
                        </Typography>
                        <Typography fontWeight={700}>5 días antes del inicio</Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant='caption' color='text.secondary'>
                          Participantes
                        </Typography>
                        <Typography fontWeight={700}>132</Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
                      <Typography variant='h5' fontWeight={800}>
                        Ranking preview
                      </Typography>

                      <Button
                        component={RouterLink}
                        to='/leaderboard'
                        variant='text'
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Ver tabla completa
                      </Button>
                    </Stack>

                    <Stack spacing={1.25}>
                      {leaderboardPreview.map((user) => (
                        <Box
                          key={user.position}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '56px 1fr auto',
                            gap: 2,
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            // bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography fontWeight={800}>#{user.position}</Typography>

                          <Typography
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {user.name}
                          </Typography>

                          <Chip
                            label={`${user.points} pts`}
                            color={user.position === 1 ? 'primary' : 'default'}
                            variant={user.position === 1 ? 'filled' : 'outlined'}
                            size='small'
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: { xs: 'left', md: 'center' }
            }}
          >
            <Stack spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
              <Typography variant='h4' fontWeight={800}>
                ¿Listo para jugar tu quiniela?
              </Typography>

              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 760, lineHeight: 1.7 }}>
                Crea tu cuenta, carga tus predicciones antes del cierre y compite por quedar en lo más alto de la tabla
                global.
              </Typography>

              <Button
                component={RouterLink}
                to='/register'
                variant='contained'
                size='large'
                sx={{
                  minWidth: { xs: '100%', sm: 240 },
                  minHeight: 48,
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                Registrarme ahora
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
