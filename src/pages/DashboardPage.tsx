import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { useMatches } from '../features/matches/useMatches';
import { usePredictionsByUser } from '../features/predictions/usePredictionsByUser';
import { useLeaderboard } from '../features/leaderboard/useLeaderboard';
import { useAppSettings } from '../features/settings/useAppSettings';
import type { Match } from '../features/matches/types';
import { PageHeader, type PageHeaderBadge } from '../components/ui/PageHeader';
import { MatchVs } from '../features/matches/components/MatchVs';

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

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function getTournamentPhase(matches: Match[]) {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');
  const knockoutMatches = matches.filter((match) => match.stage !== 'group_stage');

  if (groupStageMatches.length === 0 && knockoutMatches.length > 0) {
    return 'Eliminación';
  }

  const isGroupStageFinished =
    groupStageMatches.length > 0 && groupStageMatches.every((match) => match.status === 'finished');

  return isGroupStageFinished ? 'Eliminación' : 'Grupos';
}

function MetricCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
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
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={0.75}>
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

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='h5' fontWeight={800}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

function ProgressBlock({ label, valueLabel, progress }: { label: string; valueLabel: string; progress: number }) {
  return (
    <Stack spacing={0.75}>
      <Stack direction='row' justifyContent='space-between' spacing={1}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='body2' fontWeight={700}>
          {valueLabel}
        </Typography>
      </Stack>

      <LinearProgress
        variant='determinate'
        value={Math.max(0, Math.min(progress, 100))}
        sx={{
          height: 10,
          borderRadius: 999
        }}
      />
    </Stack>
  );
}

function ComparisonRow({
  label,
  value,
  maxValue,
  color = 'primary.main'
}: {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}) {
  const ratio = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <Stack spacing={0.5}>
      <Stack direction='row' justifyContent='space-between' spacing={1}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='body2' fontWeight={700}>
          {value}
        </Typography>
      </Stack>

      <Box
        sx={(theme) => ({
          height: 10,
          width: '100%',
          borderRadius: 999,
          bgcolor: alpha(theme.palette.common.white, 0.08),
          overflow: 'hidden'
        })}
      >
        <Box
          sx={{
            height: '100%',
            width: `${Math.max(0, Math.min(ratio, 100))}%`,
            borderRadius: 999,
            bgcolor: color
          }}
        />
      </Box>
    </Stack>
  );
}

export function DashboardPage() {
  const { user, profile } = useAuth();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: predictions = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError,
    error: predictionsError
  } = usePredictionsByUser(user?.id!);

  const {
    data: leaderboard = [],
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError
  } = useLeaderboard();

  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const isLoading = isMatchesLoading || isPredictionsLoading || isLeaderboardLoading || isSettingsLoading;
  const isError = isMatchesError || isPredictionsError || isLeaderboardError || isSettingsError;
  const firstError = matchesError || predictionsError || leaderboardError || settingsError;

  const predictedMatchIds = React.useMemo(() => {
    return new Set(predictions.map((prediction) => prediction.match_id));
  }, [predictions]);

  const sortedMatches = React.useMemo(() => sortMatchesByKickoff(matches), [matches]);

  const scheduledMatches = React.useMemo(() => {
    return sortedMatches.filter((match) => match.status === 'scheduled');
  }, [sortedMatches]);

  const finishedMatches = React.useMemo(() => {
    return matches.filter((match) => match.status === 'finished');
  }, [matches]);

  const liveMatches = React.useMemo(() => {
    return matches.filter((match) => match.status === 'live');
  }, [matches]);

  const pendingPredictionMatches = React.useMemo(() => {
    return scheduledMatches.filter((match) => !predictedMatchIds.has(match.id));
  }, [scheduledMatches, predictedMatchIds]);

  const nextPendingMatch = pendingPredictionMatches[0] ?? null;
  const nextTournamentMatch = scheduledMatches[0] ?? null;

  const currentUserRow = React.useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.find((row) => row.user_id === user.id) ?? null;
  }, [leaderboard, user?.id]);

  const leaderRow = leaderboard[0] ?? null;
  const leaderPoints = leaderRow?.total_points ?? 0;
  const myPoints = currentUserRow?.total_points ?? 0;
  const distanceToLeader = Math.max(leaderPoints - myPoints, 0);

  const globalPosition = React.useMemo(() => {
    if (!user?.id) return null;

    const index = leaderboard.findIndex((row) => row.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [leaderboard, user?.id]);

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const totalMatches = matches.length;
  const loadedPredictions = predictions.length;
  const pendingPredictions = pendingPredictionMatches.length;
  const scoredPredictions = currentUserRow?.scored_predictions ?? 0;
  const exactHits = currentUserRow?.exact_hits ?? 0;
  const outcomeHits = currentUserRow?.outcome_hits ?? 0;
  const missCount = Math.max(scoredPredictions - exactHits - outcomeHits, 0);

  const predictionLoadProgress = totalMatches > 0 ? (loadedPredictions / totalMatches) * 100 : 0;
  const tournamentProgress = totalMatches > 0 ? (finishedMatches.length / totalMatches) * 100 : 0;
  const evaluatedProgress = finishedMatches.length > 0 ? (scoredPredictions / finishedMatches.length) * 100 : 0;

  const tournamentPhase = getTournamentPhase(matches);

  const badges: PageHeaderBadge[] = [
    {
      label: predictionsClosed ? 'Pronósticos cerrados' : 'Pronósticos abiertos',
      color: predictionsClosed ? 'warning' : 'success',
      variant: predictionsClosed ? 'outlined' : 'filled'
    },
    {
      label: `Posición ${globalPosition ? `#${globalPosition}` : '-'}`,
      color: 'primary',
      variant: 'outlined'
    },
    {
      label: `${scoredPredictions} evaluados`,
      color: 'default',
      variant: 'outlined'
    }
  ];

  const quickStats = [
    {
      label: 'Pronósticos cargados',
      value: loadedPredictions,
      helper: `${formatPercent(predictionLoadProgress)} del torneo`
    },
    {
      label: 'Pendientes por cargar',
      value: pendingPredictions,
      helper: `${totalMatches} partidos totales`
    },
    {
      label: 'Puntos actuales',
      value: myPoints,
      helper: currentUserRow ? `${exactHits} exactos` : 'Sin evaluación todavía'
    },
    {
      label: 'Distancia al líder',
      value: `${distanceToLeader} pts`,
      helper: leaderRow ? `Líder: ${leaderRow.display_name}` : 'Sin líder definido'
    }
  ];

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity='error'>
        {firstError instanceof Error ? firstError.message : 'No se pudo cargar el panel de control'}
      </Alert>
    );
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Panel de control'
        description='Sigue el estado del torneo y tu rendimiento dentro de la quiniela desde un solo lugar.'
        badges={badges}
      />

      <Grid container spacing={1.5}>
        {quickStats.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <MetricCard label={item.label} value={item.value} helper={item.helper} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, xl: 7 }}>
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
              <Stack spacing={3}>
                <Stack spacing={0.75}>
                  <Typography variant='h5' fontWeight={800}>
                    Tu participación
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    Mira cuánto llevas cargado, cómo vienes puntuando y qué tan lejos estás del líder.
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip label={`${loadedPredictions} cargados`} color='primary' variant='outlined' />
                  <Chip label={`${pendingPredictions} pendientes`} variant='outlined' />
                  <Chip label={`${myPoints} pts`} color='primary' />
                </Stack>

                <ProgressBlock
                  label='Progreso de carga'
                  valueLabel={`${loadedPredictions} / ${totalMatches}`}
                  progress={predictionLoadProgress}
                />

                <ProgressBlock
                  label='Partidos evaluados'
                  valueLabel={`${scoredPredictions} / ${finishedMatches.length}`}
                  progress={evaluatedProgress}
                />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='Exactos' value={exactHits} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='Aciertos de signo' value={outcomeHits} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='Sin puntuar' value={missCount} />
                  </Grid>
                </Grid>

                <Stack spacing={1.25}>
                  <Typography variant='subtitle1' fontWeight={800}>
                    Comparación con el líder
                  </Typography>

                  <ComparisonRow label='Tus puntos' value={myPoints} maxValue={Math.max(leaderPoints, myPoints, 1)} />
                  <ComparisonRow
                    label='Puntos del líder'
                    value={leaderPoints}
                    maxValue={Math.max(leaderPoints, myPoints, 1)}
                    color='success.main'
                  />

                  <Typography variant='body2' color='text.secondary'>
                    Diferencia actual: {distanceToLeader} pts
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Button component={RouterLink} to='/app/predictions/matches' variant='contained'>
                    Ir a cargar pronósticos
                  </Button>

                  <Button component={RouterLink} to='/app/predictions/my-predictions' variant='outlined'>
                    Ver mis pronósticos
                  </Button>

                  <Button component={RouterLink} to='/ranking' variant='text'>
                    Ver ranking
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, xl: 5 }}>
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
              <Stack spacing={3}>
                <Stack spacing={0.75}>
                  <Typography variant='h5' fontWeight={800}>
                    Estado del torneo
                  </Typography>

                  <Typography variant='body2' color='text.secondary'>
                    Información útil del Mundial y del estado global de la quiniela.
                  </Typography>
                </Stack>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Chip label={`Fase: ${tournamentPhase}`} color='primary' variant='outlined' />
                  <Chip
                    label={predictionsClosed ? 'Carga cerrada' : 'Carga habilitada'}
                    color={predictionsClosed ? 'warning' : 'success'}
                    variant={predictionsClosed ? 'outlined' : 'filled'}
                  />
                </Stack>

                <ProgressBlock
                  label='Progreso del torneo'
                  valueLabel={`${finishedMatches.length} / ${totalMatches}`}
                  progress={tournamentProgress}
                />

                <Grid container spacing={1.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='En vivo' value={liveMatches.length} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='Finalizados' value={finishedMatches.length} />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <MiniStat label='Pendientes' value={scheduledMatches.length} />
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant='subtitle1' fontWeight={800}>
                      Próximo pendiente sin pronóstico
                    </Typography>

                    {nextPendingMatch ? (
                      <>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                          <Chip label={nextPendingMatch.group} size='small' variant='outlined' />
                          <Chip
                            label={predictionsClosed ? 'Carga global cerrada' : 'Disponible para pronosticar'}
                            size='small'
                            color={predictionsClosed ? 'warning' : 'success'}
                            variant={predictionsClosed ? 'outlined' : 'filled'}
                          />
                        </Stack>
                        <Typography variant='h6' fontWeight={800}>
                          <MatchVs match={nextPendingMatch} />
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                          {nextPendingMatch.kickoff}
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                          {nextPendingMatch.stadium} · {nextPendingMatch.city}
                        </Typography>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                          <Button
                            size='small'
                            component={RouterLink}
                            to={`/app/predictions/matches?matchId=${encodeURIComponent(nextPendingMatch.id)}`}
                            variant='contained'
                          >
                            Cargar pronóstico de este partido
                          </Button>
                        </Stack>
                      </>
                    ) : (
                      <Alert severity='success' sx={{ mt: 0.5 }}>
                        No tienes partidos pendientes por pronosticar en este momento.
                      </Alert>
                    )}
                  </Stack>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Stack spacing={1}>
                    <Typography variant='subtitle1' fontWeight={800}>
                      Info general
                    </Typography>

                    <Typography variant='body2' color='text.secondary'>
                      Fecha límite global: {formatDateTime(settings?.predictions_close_at ?? null)}
                    </Typography>

                    <Typography variant='body2' color='text.secondary'>
                      Próximo partido del torneo:{' '}
                      {nextTournamentMatch
                        ? `${nextTournamentMatch.homeTeam} vs ${nextTournamentMatch.awayTeam}`
                        : 'Sin partidos pendientes'}
                    </Typography>
                  </Stack>
                </Box>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  <Button component={RouterLink} to='/app/fixture' variant='outlined'>
                    Ver fixture
                  </Button>

                  <Button component={RouterLink} to='/app/audits' variant='text'>
                    Ir a auditorías
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {profile?.is_admin ? (
        <Card
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant='h6' fontWeight={800}>
                  Herramientas de administración
                </Typography>

                <Typography variant='body2' color='text.secondary'>
                  Accesos rápidos para gestionar partidos, resultados y configuración global.
                </Typography>
              </Stack>

              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Button component={RouterLink} to='/admin/matches' variant='outlined'>
                  Admin · Partidos
                </Button>

                <Button component={RouterLink} to='/admin/results' variant='outlined'>
                  Admin · Resultados
                </Button>

                <Button component={RouterLink} to='/admin/settings' variant='outlined'>
                  Admin · Configuración
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}
