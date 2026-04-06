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
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../features/auth/useAuth';
import { getPredictionsByUser } from '../features/predictions/predictions.api';
import { getMatches } from '../features/matches/matches.api';
import { getLeaderboard } from '../features/leaderboard/leaderboard.api';
import type { Match } from '../features/matches/types';

import { MatchFiltersCard } from '../features/matches/components/MatchFiltersCard';
import {
  filterMatches,
  getUniqueGroupOptions,
  getUniqueStageOptions,
  type MatchListFilters
} from '../features/matches/listFilters';

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

function getStatusLabel(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'En vivo';
    case 'finished':
      return 'Finalizado';
    case 'scheduled':
    default:
      return 'Pendiente';
  }
}

function getStatusColor(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'scheduled':
    default:
      return 'warning';
  }
}

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

export function PredictionsPage() {
  const { user } = useAuth();

  const [matches, setMatches] = React.useState<Match[]>([]);
  const [predictions, setPredictions] = React.useState<UserPrediction[]>([]);
  const [leaderboard, setLeaderboard] = React.useState<
    Array<{
      user_id: string;
      display_name: string;
      total_points: number;
      exact_hits: number;
      outcome_hits: number;
      scored_predictions: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  const [filters, setFilters] = React.useState<MatchListFilters>({
    stage: '',
    groupCode: '',
    teamQuery: ''
  });

  React.useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [matchesData, predictionRows, leaderboardRows] = await Promise.all([
          getMatches(),
          getPredictionsByUser(user.id),
          getLeaderboard()
        ]);

        setMatches(matchesData);
        setPredictions(
          predictionRows.map((row) => ({
            matchId: row.match_id,
            homeScore: row.home_score,
            awayScore: row.away_score
          }))
        );
        setLeaderboard(leaderboardRows);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudieron cargar tus pronósticos';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [user?.id]);

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

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1}>
            <Typography variant='h4' fontWeight={800}>
              Mis pronósticos
            </Typography>

            <Typography color='text.secondary'>
              Revisa lo que ya cargaste, compara con los resultados oficiales y mira cuántos puntos vas sumando.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Grid container spacing={2}>
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
          />

          {filteredPredictionItems.length === 0 && predictionItems.length > 0 ? (
            <Alert severity={'warning'}>No se encontraron pronósticos que coincidan con los filtros aplicados.</Alert>
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
                    <Button component={RouterLink} to='/app/matches' variant='contained'>
                      Ir a partidos
                    </Button>

                    <Button component={RouterLink} to='/app/leaderboard' variant='text'>
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

                            <Typography variant='h6' fontWeight={800}>
                              {match ? `${match.homeTeam} vs ${match.awayTeam}` : `Partido ${prediction.matchId}`}
                            </Typography>

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
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
