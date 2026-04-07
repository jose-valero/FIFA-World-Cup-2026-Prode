import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  alpha
} from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import SportsSoccerRoundedIcon from '@mui/icons-material/SportsSoccerRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Link as RouterLink } from 'react-router';
import { useAppSettings } from '../features/settings/useAppSettings';
import { useLeaderboard } from '../features/leaderboard/useLeaderboard';
import { useMatches } from '../features/matches/useMatches';
import type { Match } from '../features/matches/types';

const howItWorks = [
  {
    icon: <VerifiedRoundedIcon fontSize='small' />,
    title: 'Regístrate y entra',
    description: 'Crea tu cuenta en pocos pasos y prepárate para competir con tus amigos.'
  },
  {
    icon: <SportsSoccerRoundedIcon fontSize='small' />,
    title: 'Carga tus pronósticos',
    description: 'Predice los marcadores antes del cierre y cubre todos los partidos disponibles.'
  },
  {
    icon: <EmojiEventsRoundedIcon fontSize='small' />,
    title: 'Suma puntos y escala',
    description: 'Acierta resultados, gana puntos y pelea por el primer lugar del ranking.'
  }
];

const productHighlights = [
  {
    icon: <BoltRoundedIcon fontSize='small' />,
    title: 'Rápida de jugar',
    description: 'En pocos minutos puedes dejar cargados todos tus pronósticos.'
  },
  {
    icon: <InsightsRoundedIcon fontSize='small' />,
    title: 'Seguimiento claro',
    description: 'Ve cómo subes en la tabla y qué pronósticos ya fueron evaluados.'
  },
  {
    icon: <GroupsRoundedIcon fontSize='small' />,
    title: 'Perfecta para competir',
    description: 'Ideal para grupos de amigos, trabajo o comunidad.'
  }
];

const scoringRules = [
  {
    title: 'Aciertas ganador o empate',
    points: '+3 pts',
    description: 'Sumas puntos cuando aciertas el signo del partido.'
  },
  {
    title: 'Aciertas el marcador exacto',
    points: '5 pts',
    description: 'Si pegas el resultado completo, te llevas el máximo puntaje.'
  },
  {
    title: 'Cada fecha mueve la tabla',
    points: 'Ranking live',
    description: 'A medida que se cargan resultados oficiales, la tabla global se actualiza.'
  }
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Sin fecha definida';

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function isPredictionsClosed(predictionsOpen: boolean, predictionsCloseAt: string | null) {
  if (!predictionsOpen) return true;
  if (!predictionsCloseAt) return false;

  return new Date(predictionsCloseAt).getTime() <= Date.now();
}

function getCurrentPhase(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');

  if (groupStageMatches.length === 0) {
    return 'Torneo cargado';
  }

  const isGroupStageFinished = groupStageMatches.every((match) => match.status === 'finished');

  return isGroupStageFinished ? 'Fase de eliminación' : 'Fase de grupos';
}

function getNextScheduledMatch(matches: Match[]) {
  const nextMatch = [...matches]
    .filter((match) => match.status === 'scheduled')
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())[0];

  return nextMatch ?? null;
}

function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>

          <Typography variant='h4' fontWeight={800}>
            {value}
          </Typography>

          {helper ? (
            <Typography variant='caption' color='text.secondary'>
              {helper}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const {
    data: leaderboard = [],
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError
  } = useLeaderboard();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const isLoading = isLeaderboardLoading || isMatchesLoading || isSettingsLoading;
  const isError = isLeaderboardError || isMatchesError || isSettingsError;
  const firstError = leaderboardError || matchesError || settingsError;

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const currentPhase = getCurrentPhase(matches);
  const nextMatch = getNextScheduledMatch(matches);
  const leaderboardPreview = leaderboard.slice(0, 5);
  const leader = leaderboard[0] ?? null;

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Box component='section'>
      <Stack spacing={4}>
        {isError ? (
          <Alert severity='error'>
            {firstError instanceof Error ? firstError.message : 'No se pudo cargar la portada'}
          </Alert>
        ) : null}

        <Paper
          elevation={0}
          sx={(theme) => ({
            p: { xs: 3, sm: 4, md: 6 },
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.18),
            background: `linear-gradient(
              135deg,
              ${alpha(theme.palette.primary.main, 0.1)} 0%,
              ${alpha(theme.palette.background.paper, 0.9)} 35%,
              ${alpha(theme.palette.background.paper, 0.96)} 100%
            )`
          })}
        >
          <Grid container spacing={3} alignItems='center'>
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={3}>
                <Stack spacing={2}>
                  <Chip
                    label='Mundial FIFA 2026'
                    color='primary'
                    variant='outlined'
                    sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                  />

                  <Typography
                    variant='h1'
                    sx={{
                      fontSize: { xs: '2.25rem', sm: '3.2rem', md: '4.2rem' },
                      lineHeight: 1.02,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      maxWidth: 760
                    }}
                  >
                    Tu quiniela para competir partido a partido y subir al ranking global
                  </Typography>

                  <Typography
                    variant='body1'
                    color='text.secondary'
                    sx={{
                      maxWidth: 720,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      lineHeight: 1.75
                    }}
                  >
                    Carga tus pronósticos, sigue el fixture completo, suma puntos por cada acierto y pelea por quedar en
                    lo más alto de la tabla.
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1.25} flexWrap='wrap' useFlexGap>
                  <Chip
                    label={predictionsClosed ? 'Pronósticos cerrados' : 'Pronósticos abiertos'}
                    color={predictionsClosed ? 'warning' : 'success'}
                  />
                  <Chip label={currentPhase} variant='outlined' color='primary' />
                  {leader ? <Chip label={`Líder: ${leader.display_name}`} variant='outlined' /> : null}
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1, width: '100%', maxWidth: 460 }}>
                  <Button
                    component={RouterLink}
                    to='/register'
                    variant='contained'
                    size='large'
                    fullWidth
                    sx={{
                      minHeight: 50,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 800
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
                      minHeight: 50,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 800
                    }}
                  >
                    Ver ranking
                  </Button>
                </Stack>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '100%'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2.5}>
                    <Typography variant='h6' fontWeight={800}>
                      Resumen en vivo
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <StatCard label='Participantes' value={leaderboard.length} helper='Usuarios en competencia' />
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <StatCard label='Partidos' value={matches.length} helper='Fixture cargado' />
                      </Grid>
                    </Grid>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant='body2' color='text.secondary'>
                        Próximo partido
                      </Typography>

                      {nextMatch ? (
                        <>
                          <Typography fontWeight={800}>
                            {nextMatch.homeTeam} vs {nextMatch.awayTeam}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {nextMatch.kickoff}
                          </Typography>
                        </>
                      ) : (
                        <Typography color='text.secondary'>No hay partidos pendientes por mostrar.</Typography>
                      )}
                    </Stack>

                    <Divider />

                    <Stack spacing={1}>
                      <Typography variant='body2' color='text.secondary'>
                        Cierre global de pronósticos
                      </Typography>
                      <Typography fontWeight={800}>{formatDateTime(settings?.predictions_close_at ?? null)}</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label='Líder actual'
              value={leader ? leader.display_name : '-'}
              helper='Primer lugar del ranking'
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label='Puntaje líder'
              value={leader ? `${leader.total_points} pts` : '-'}
              helper='Puntaje a alcanzar'
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <StatCard
              label='Partidos ya evaluados'
              value={
                matches.filter((match) => match.officialHomeScore !== null && match.officialAwayScore !== null).length
              }
              helper='Resultados oficiales cargados'
            />
          </Grid>
        </Grid>

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
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <Box sx={{ display: 'inline-flex', color: 'primary.main' }}>{item.icon}</Box>
                        <Typography variant='h6' fontWeight={700}>
                          {item.title}
                        </Typography>
                      </Stack>

                      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
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
            ¿Por qué engancha?
          </Typography>

          <Grid container spacing={2}>
            {productHighlights.map((item) => (
              <Grid key={item.title} size={{ xs: 12, md: 4 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={1.5}>
                      <Stack direction='row' spacing={1} alignItems='center'>
                        <Box sx={{ display: 'inline-flex', color: 'primary.main' }}>{item.icon}</Box>
                        <Typography variant='h6' fontWeight={700}>
                          {item.title}
                        </Typography>
                      </Stack>

                      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
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
                    borderRadius: 2,
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

                        <Typography variant='h4' color='primary' sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
                          {rule.points}
                        </Typography>
                      </Stack>

                      <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
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
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 2,
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

                  {leaderboardPreview.length === 0 ? (
                    <Alert severity='info'>Todavía no hay suficientes datos para mostrar el ranking.</Alert>
                  ) : (
                    <Stack spacing={1.25}>
                      {leaderboardPreview.map((player, index) => (
                        <Box
                          key={player.user_id}
                          sx={(theme) => ({
                            display: 'grid',
                            gridTemplateColumns: '56px 1fr auto',
                            gap: 2,
                            alignItems: 'center',
                            px: 2,
                            py: 1.5,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: index === 0 ? alpha(theme.palette.primary.main, 0.4) : 'divider',
                            background: index === 0 ? alpha(theme.palette.primary.main, 0.08) : undefined
                          })}
                        >
                          <Typography fontWeight={900}>#{index + 1}</Typography>

                          <Typography
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {player.display_name}
                          </Typography>

                          <Chip
                            label={`${player.total_points} pts`}
                            color={index === 0 ? 'primary' : 'default'}
                            variant={index === 0 ? 'filled' : 'outlined'}
                            size='small'
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant='h5' fontWeight={800}>
                    Lo que hace fuerte esta quiniela
                  </Typography>

                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
                    No es solo cargar resultados: es seguir el torneo, medir tu rendimiento, compararte con los demás y
                    mantener la competencia viva durante todo el Mundial.
                  </Typography>

                  <Divider />

                  <Stack spacing={1.25}>
                    <Typography variant='body2' color='text.secondary'>
                      ✔ Fixture completo y fase de eliminación
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ✔ Ranking global actualizado con resultados oficiales
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ✔ Auditorias para ver los resultados y transparencia
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ✔ Vista clara de tus pronósticos y rendimiento
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      ✔ Ideal para sumar más amigos y competir en serio
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

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
              Crea tu cuenta, carga tus predicciones antes del cierre y compite por quedar en lo más alto del ranking
              global del Mundial 2026.
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
      </Stack>
    </Box>
  );
}
