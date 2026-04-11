import { Paper, Card, CardContent, Grid, Stack, Typography, alpha, Chip, Button, Divider } from '@mui/material';
import { StatCard } from './StatCard';
import { formatDateTime } from '../../../shared/utils/formatDateTime';
import { isPredictionsClosed } from '../../../shared/utils/isPredictionsClosed';
import { currentPhase as _currentPhase } from '../utils/currentPhase';
import { Link as RouterLink } from 'react-router';
import { getNextScheduledMatch } from '../utils/getNextScheduledMatch';
import type { Match } from '../../matches/types/types';
import type { LeaderboardRow } from '../../leaderboard/types/leaderboard.types';
import type { AppSettings } from '../../admin/settings/api/appSettings.api';

interface HomeHeroProps {
  matches: Match[];
  leaderboard: LeaderboardRow[];
  settings: AppSettings | null;
}

export const HomeHero = ({ leaderboard, matches, settings }: HomeHeroProps) => {
  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const currentPhase = _currentPhase(matches);

  const leader = leaderboard[0] ?? null;

  const nextMatch = getNextScheduledMatch(matches);

  return (
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
                Carga tus pronósticos, sigue el fixture completo, suma puntos por cada acierto y pelea por quedar en lo
                más alto de la tabla.
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
  );
};
