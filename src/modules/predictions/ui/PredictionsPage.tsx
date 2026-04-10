import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import { ConfirmDeleteDialog } from '../../../shared/components/ConfirmDeleteDialog';
import { Link as RouterLink } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMatches } from '../../matches/hooks/useMatches';
import { usePredictionsByUser } from '../hooks/usePredictionsByUser';
import { useLeaderboard } from '../../leaderboard/hooks/useLeaderboard';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import {
  filterMatches,
  getUniqueGroupOptions,
  getUniqueStageOptions,
  type MatchListFilters
} from '../../matches/utils/listFilters';
import { MatchFiltersCard } from '../../../shared/components/MatchFiltersCard';
import { MatchVs } from '../../../shared/components/MatchVs';
import type { Match } from '../../matches/types/types';
import type { PredictionRow } from '../types/predictions.types';
import { deletePrediction } from '../api/predictions.api';
import { isMatchLocked } from '../utils/isMatchLocked';
import { isPredictionsClosed } from '../../../shared/utils/isPredictionsClosed';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { getStatusLabel } from '../../../shared/utils/getStatusLabel';
import { getStatusColor } from '../../../shared/utils/getStatusColor';

type UserPrediction = {
  matchId: string;
  homeScore: number;
  awayScore: number;
};

type PredictionWithMatch = {
  match: Match | null;
  prediction: UserPrediction;
  points: number | null;
  isExactHit: boolean;
  isOutcomeHit: boolean;
};

function getPredictionOutcome(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function getPredictionPoints(prediction: UserPrediction, match: Match | null) {
  if (!match) {
    return {
      points: null,
      isExactHit: false,
      isOutcomeHit: false
    };
  }

  if (match.officialHomeScore === null || match.officialAwayScore === null) {
    return {
      points: null,
      isExactHit: false,
      isOutcomeHit: false
    };
  }

  const isExactHit =
    prediction.homeScore === match.officialHomeScore && prediction.awayScore === match.officialAwayScore;

  if (isExactHit) {
    return {
      points: 5,
      isExactHit: true,
      isOutcomeHit: true
    };
  }

  const predictionOutcome = getPredictionOutcome(prediction.homeScore, prediction.awayScore);
  const officialOutcome = getPredictionOutcome(match.officialHomeScore, match.officialAwayScore);
  const isOutcomeHit = predictionOutcome === officialOutcome;

  return {
    points: isOutcomeHit ? 3 : 0,
    isExactHit: false,
    isOutcomeHit
  };
}

function sortByKickoff(items: PredictionWithMatch[]) {
  return [...items].sort((a, b) => {
    const aTime = a.match ? new Date(a.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.match ? new Date(b.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
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
      <CardContent sx={{ p: 2.25 }}>
        <Stack spacing={0.75}>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>

          <Typography variant='h5' fontWeight={800}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function PredictionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: predictionRows = [],
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

  const { data: settings = null } = useAppSettings();

  const [filters, setFilters] = React.useState<MatchListFilters>({
    stage: '',
    groupCode: '',
    teamQuery: ''
  });
  const [errorMessage, setErrorMessage] = React.useState('');
  const [deletingMatchId, setDeletingMatchId] = React.useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = React.useState<{ matchId: string; match: Match } | null>(null);
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const isLoading = isMatchesLoading || isPredictionsLoading || isLeaderboardLoading;
  const isError = isMatchesError || isPredictionsError || isLeaderboardError;
  const firstError = matchesError || predictionsError || leaderboardError;

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const predictions = React.useMemo(() => {
    return predictionRows.map((row) => ({
      matchId: row.match_id,
      homeScore: row.home_score,
      awayScore: row.away_score
    }));
  }, [predictionRows]);

  const matchMap = React.useMemo(() => {
    return new Map(matches.map((match) => [match.id, match]));
  }, [matches]);

  const predictionItems = React.useMemo(() => {
    const items = predictions.map((prediction) => {
      const match = matchMap.get(prediction.matchId) ?? null;
      const scoring = getPredictionPoints(prediction, match);

      return {
        prediction,
        match,
        points: scoring.points,
        isExactHit: scoring.isExactHit,
        isOutcomeHit: scoring.isOutcomeHit
      };
    });

    return sortByKickoff(items);
  }, [predictions, matchMap]);

  const stageOptions = React.useMemo(() => {
    return getUniqueStageOptions(predictionItems.map((item) => item.match).filter(Boolean) as Match[]);
  }, [predictionItems]);

  const groupOptions = React.useMemo(() => {
    return getUniqueGroupOptions(predictionItems.map((item) => item.match).filter(Boolean) as Match[]);
  }, [predictionItems]);

  const filteredPredictionItems = React.useMemo(() => {
    return predictionItems.filter((item) => {
      if (!item.match) return false;
      return filterMatches([item.match], filters).length > 0;
    });
  }, [predictionItems, filters]);

  const currentUserLeaderboardRow = React.useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.find((row) => row.user_id === user.id) ?? null;
  }, [leaderboard, user?.id]);

  const localSummary = React.useMemo(() => {
    const evaluated = predictionItems.filter((item) => item.points !== null);
    const exactHits = predictionItems.filter((item) => item.isExactHit).length;
    const outcomeHits = predictionItems.filter((item) => item.isOutcomeHit).length;
    const totalPoints = evaluated.reduce((acc, item) => acc + (item.points ?? 0), 0);

    return {
      loaded: predictionItems.length,
      evaluated: evaluated.length,
      exactHits,
      outcomeHits,
      totalPoints
    };
  }, [predictionItems]);

  const summaryStats = [
    { label: 'Pronósticos cargados', value: localSummary.loaded },
    {
      label: 'Partidos evaluados',
      value: currentUserLeaderboardRow?.scored_predictions ?? localSummary.evaluated
    },
    { label: 'Puntos', value: currentUserLeaderboardRow?.total_points ?? localSummary.totalPoints },
    { label: 'Exactos', value: currentUserLeaderboardRow?.exact_hits ?? localSummary.exactHits }
  ];

  const handleRequestDelete = (matchId: string, match: Match) => {
    if (!user?.id) return;

    if (isMatchLocked(match, predictionsClosed)) {
      setErrorMessage(
        match.status !== 'scheduled'
          ? 'Este partido ya no admite cambios.'
          : 'La carga de pronósticos está cerrada.'
      );
      return;
    }

    setMatchToDelete({ matchId, match });
  };

  const handleConfirmDelete = async () => {
    if (!user?.id || !matchToDelete) return;

    const { matchId } = matchToDelete;
    setDeletingMatchId(matchId);

    try {
      await deletePrediction({ userId: user.id, matchId });

      queryClient.setQueryData(queryKeys.predictions(user.id), (prev: PredictionRow[] | undefined) => {
        if (!prev) return [];
        return prev.filter((row) => row.match_id !== matchId);
      });

      await queryClient.invalidateQueries({ queryKey: queryKeys.auditPredictions });
      setSnackbar({ open: true, message: 'Pronóstico eliminado correctamente', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo limpiar el pronóstico';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setDeletingMatchId(null);
      setMatchToDelete(null);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant='h5' fontWeight={800}>
          Mis pronósticos
        </Typography>

        <Typography variant='body2' color='text.secondary'>
          Revisa lo que ya cargaste y cómo se compara con los resultados oficiales.
        </Typography>
      </Stack>

      {isError ? (
        <Alert severity='error'>
          {firstError instanceof Error ? firstError.message : 'No se pudieron cargar tus pronósticos'}
        </Alert>
      ) : null}

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Grid container spacing={1.5}>
            {summaryStats.map((item) => (
              <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryCard label={item.label} value={item.value} />
              </Grid>
            ))}
          </Grid>

          <MatchFiltersCard
            title='Filtrar pronósticos'
            filters={filters}
            onChange={(field, value) =>
              setFilters((prev) => ({
                ...prev,
                [field]: value
              }))
            }
            stageOptions={stageOptions}
            groupOptions={groupOptions}
            collapsible
          />

          {filteredPredictionItems.length === 0 && predictionItems.length > 0 ? (
            <Alert severity='warning'>No se encontraron pronósticos que coincidan con los filtros aplicados.</Alert>
          ) : null}

          {predictionItems.length === 0 ? (
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
                  <Typography color='text.secondary'>Aún no has cargado ningún pronóstico.</Typography>

                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Button component={RouterLink} to='/app/predictions/matches' variant='contained'>
                      Ir a partidos
                    </Button>

                    <Button component={RouterLink} to='/leaderboard' variant='text'>
                      Ver ranking
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ) : (
            <Stack spacing={2}>
              {filteredPredictionItems.map((item) => {
                const { match, prediction, points, isExactHit, isOutcomeHit } = item;

                return (
                  <Card
                    key={prediction.matchId}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={2}
                          justifyContent='space-between'
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                        >
                          <Stack spacing={0.75}>
                            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                              {match ? <Chip label={match.group} size='small' variant='outlined' /> : null}
                              {match ? (
                                <Chip
                                  label={getStatusLabel(match.status)}
                                  size='small'
                                  color={getStatusColor(match.status)}
                                  variant='outlined'
                                />
                              ) : (
                                <Chip label='Partido no encontrado' size='small' color='default' variant='outlined' />
                              )}
                            </Stack>

                            <MatchVs match={match} />

                            {match ? (
                              <>
                                <Typography variant='body2' color='text.secondary'>
                                  {match.kickoff}
                                </Typography>

                                <Typography variant='body2' color='text.secondary'>
                                  {match.stadium} · {match.city}
                                </Typography>
                              </>
                            ) : null}
                          </Stack>

                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            {points === null ? (
                              <Chip label='Sin evaluar' color='default' />
                            ) : (
                              <Chip
                                label={`${points} pts`}
                                color={points > 0 ? 'success' : 'default'}
                                variant={points > 0 ? 'filled' : 'outlined'}
                              />
                            )}

                            {isExactHit ? <Chip label='Exacto' color='success' variant='outlined' /> : null}
                            {!isExactHit && isOutcomeHit ? (
                              <Chip label='Acierto de signo' color='primary' variant='outlined' />
                            ) : null}
                          </Stack>
                        </Stack>

                        <Divider />

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={0.5}>
                              <Typography variant='body2' color='text.secondary'>
                                Tu pronóstico
                              </Typography>

                              <Typography fontWeight={800}>
                                {prediction.homeScore} - {prediction.awayScore}
                              </Typography>
                            </Stack>
                          </Grid>

                          <Grid size={{ xs: 12, md: 6 }}>
                            <Stack spacing={0.5}>
                              <Typography variant='body2' color='text.secondary'>
                                Resultado oficial
                              </Typography>

                              <Typography fontWeight={800}>
                                {match && match.officialHomeScore !== null && match.officialAwayScore !== null
                                  ? `${match.officialHomeScore} - ${match.officialAwayScore}`
                                  : 'Pendiente'}
                              </Typography>
                            </Stack>
                          </Grid>
                        </Grid>

                        {match && !isMatchLocked(match, predictionsClosed) ? (
                          <Stack direction='row' justifyContent='flex-end'>
                            <Button
                              size='small'
                              color='error'
                              variant='outlined'
                              disabled={deletingMatchId === prediction.matchId}
                              onClick={() => handleRequestDelete(prediction.matchId, match)}
                            >
                              {deletingMatchId === prediction.matchId ? 'Limpiando...' : 'Limpiar pronóstico'}
                            </Button>
                          </Stack>
                        ) : null}
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </>
      )}

      <ConfirmDeleteDialog
        open={Boolean(matchToDelete)}
        title='Limpiar pronóstico'
        description={
          matchToDelete
            ? `¿Seguro que quieres limpiar tu pronóstico para ${matchToDelete.match.homeTeam} vs ${matchToDelete.match.awayTeam}?`
            : undefined
        }
        confirmLabel='Limpiar'
        isLoading={deletingMatchId !== null}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setMatchToDelete(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
