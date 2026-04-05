import * as React from 'react';
import { Alert, Button, Card, CardContent, Chip, CircularProgress, Grid, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { getMatches } from '../features/matches/matches.api';
import type { Match } from '../features/matches/types';
import { getPredictionsByUser, type PredictionRow } from '../features/predictions/predictions.api';
import { getLeaderboard, type LeaderboardRow } from '../features/leaderboard/leaderboard.api';
import { getAppSettings, type AppSettings } from '../features/settings/appSettings.api';

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

function sortMatchesByKickoff(matches: Match[]) {
  return [...matches].sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime());
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
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
        <Stack spacing={1}>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>

          <Typography variant='h4' fontWeight={800}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const [matches, setMatches] = React.useState<Match[]>([]);
  const [predictions, setPredictions] = React.useState<PredictionRow[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardRow[]>([]);
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [matchesData, predictionsData, leaderboardData, settingsData] = await Promise.all([
          getMatches(),
          getPredictionsByUser(user.id),
          getLeaderboard(),
          getAppSettings()
        ]);

        setMatches(matchesData);
        setPredictions(predictionsData);
        setLeaderboard(leaderboardData);
        setSettings(settingsData);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el resumen';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [user?.id]);

  const predictedMatchIds = React.useMemo(() => {
    return new Set(predictions.map((prediction) => prediction.match_id));
  }, [predictions]);

  const scheduledMatches = React.useMemo(() => {
    return sortMatchesByKickoff(matches.filter((match) => match.status === 'scheduled'));
  }, [matches]);

  const pendingPredictionMatches = React.useMemo(() => {
    return scheduledMatches.filter((match) => !predictedMatchIds.has(match.id));
  }, [scheduledMatches, predictedMatchIds]);

  const nextPendingMatch = pendingPredictionMatches[0] ?? null;

  const currentUserRow = React.useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.find((row) => row.user_id === user.id) ?? null;
  }, [leaderboard, user?.id]);

  const globalPosition = React.useMemo(() => {
    if (!user?.id) return null;

    const index = leaderboard.findIndex((row) => row.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, user?.id]);

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const quickStats = [
    { label: 'Pronósticos cargados', value: predictions.length },
    { label: 'Pendientes por cargar', value: pendingPredictionMatches.length },
    { label: 'Puntos actuales', value: currentUserRow?.total_points ?? 0 },
    { label: 'Posición global', value: globalPosition ? `#${globalPosition}` : '-' }
  ];

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (errorMessage) {
    return <Alert severity='error'>{errorMessage}</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {quickStats.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard label={item.label} value={item.value} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
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
              <Stack spacing={2.5}>
                <Stack spacing={1}>
                  <Typography variant='h6' fontWeight={800}>
                    Estado de la quiniela
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    Resumen general del torneo y de cómo vienes puntuando hasta ahora.
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip
                    label={predictionsClosed ? 'Pronósticos cerrados' : 'Pronósticos abiertos'}
                    color={predictionsClosed ? 'warning' : 'success'}
                  />

                  <Chip
                    label={`Resultados computados: ${currentUserRow?.scored_predictions ?? 0}`}
                    variant='outlined'
                  />
                </Stack>

                <Typography variant='body2' color='text.secondary'>
                  Fecha límite global: {formatDateTime(settings?.predictions_close_at ?? null)}
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label='Exactos' value={currentUserRow?.exact_hits ?? 0} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label='Aciertos de resultado' value={currentUserRow?.outcome_hits ?? 0} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <StatCard label='Partidos puntuados' value={currentUserRow?.scored_predictions ?? 0} />
                  </Grid>
                </Grid>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Button component={RouterLink} to='/leaderboard' variant='outlined'>
                    Ver ranking
                  </Button>

                  <Button component={RouterLink} to='/app/predictions' variant='text'>
                    Ver mis pronósticos
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
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
              <Stack spacing={2.5}>
                <Stack spacing={1}>
                  <Typography variant='h6' fontWeight={800}>
                    Próximo pendiente
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    El siguiente partido que todavía no has pronosticado.
                  </Typography>
                </Stack>

                {nextPendingMatch ? (
                  <Stack spacing={2}>
                    <Stack spacing={0.5}>
                      <Typography variant='h5' fontWeight={800}>
                        {nextPendingMatch.homeTeam} vs {nextPendingMatch.awayTeam}
                      </Typography>

                      <Typography variant='body2' color='text.secondary'>
                        {nextPendingMatch.kickoff}
                      </Typography>

                      <Typography variant='body2' color='text.secondary'>
                        {nextPendingMatch.stadium} · {nextPendingMatch.city}
                      </Typography>
                    </Stack>

                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      <Chip label={nextPendingMatch.group} variant='outlined' />
                      <Chip
                        label={predictionsClosed ? 'Carga global cerrada' : 'Disponible para pronosticar'}
                        color={predictionsClosed ? 'warning' : 'primary'}
                        variant={predictionsClosed ? 'outlined' : 'filled'}
                      />
                    </Stack>

                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      <Button component={RouterLink} to='/app/matches' variant='contained'>
                        Ir a partidos
                      </Button>

                      <Button component={RouterLink} to='/app/predictions' variant='text'>
                        Revisar mis pronósticos
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Stack spacing={2}>
                    <Alert severity='success'>No tienes partidos pendientes por pronosticar en este momento.</Alert>

                    <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                      <Button component={RouterLink} to='/app/predictions' variant='outlined'>
                        Ver mis pronósticos
                      </Button>

                      <Button component={RouterLink} to='/leaderboard' variant='text'>
                        Ver ranking
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
