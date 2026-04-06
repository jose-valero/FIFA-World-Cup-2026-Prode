import * as React from 'react';
import { Alert, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material';
import { MatchCard } from '../features/matches/components/MatchCard';
import { PredictionDialog } from '../features/matches/components/PredictionDialog';
import type { Match } from '../features/matches/types';
import { upsertPrediction } from '../features/predictions/predictions.api';
import { useAuth } from '../features/auth/useAuth';

import { MatchFiltersCard } from '../features/matches/components/MatchFiltersCard';
import {
  filterMatches,
  getUniqueGroupOptions,
  getUniqueStageOptions,
  type MatchListFilters
} from '../features/matches/listFilters';
import { useQueryClient } from '@tanstack/react-query';
import { useMatches } from '../features/matches/useMatches';
import { usePredictionsByUser } from '../features/predictions/usePredictionsByUser';
import { useAppSettings } from '../features/settings/useAppSettings';
import { queryKeys } from '../lib/react-query/queryKeys';

type MatchPredictionMap = Record<
  string,
  {
    homeScore: number;
    awayScore: number;
  }
>;

function buildPredictionSummary(prediction?: { homeScore: number; awayScore: number }) {
  if (!prediction) return null;
  return `${prediction.homeScore} - ${prediction.awayScore}`;
}

function isPredictionsClosed(predictionsOpen: boolean, predictionsCloseAt: string | null) {
  if (!predictionsOpen) return true;
  if (!predictionsCloseAt) return false;
  return new Date(predictionsCloseAt).getTime() <= Date.now();
}

function isMatchLocked(match: Match, predictionsClosed: boolean) {
  if (predictionsClosed) return true;
  return match.status !== 'scheduled';
}

function getMatchLockMessage(match: Match, predictionsClosed: boolean) {
  if (predictionsClosed) {
    return 'La carga de pronósticos está cerrada.';
  }

  if (match.status === 'live') {
    return 'Este partido ya está en vivo y no admite cambios.';
  }

  if (match.status === 'finished') {
    return 'Este partido ya está finalizado y no admite cambios.';
  }

  return '';
}

export function MatchesPage() {
  const { user } = useAuth();
  // por ahora solo para mutar
  const queryClient = useQueryClient();

  // const [matches, setMatches] = React.useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [filters, setFilters] = React.useState<MatchListFilters>({
    stage: '',
    groupCode: '',
    teamQuery: ''
  });

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
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const isLoading = isMatchesLoading || isPredictionsLoading || isSettingsLoading;
  const isError = isMatchesError || isPredictionsError || isSettingsError;
  const firstError = matchesError || predictionsError || settingsError;

  const predictions = React.useMemo(() => {
    return predictionRows.reduce<MatchPredictionMap>((acc, row) => {
      acc[row.match_id] = {
        homeScore: row.home_score,
        awayScore: row.away_score
      };
      return acc;
    }, {});
  }, [predictionRows]);

  const selectedPrediction = selectedMatch ? predictions[selectedMatch.id] : undefined;
  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  // const [predictions, setPredictions] = React.useState<MatchPredictionMap>({});
  // const [predictionsOpen, setPredictionsOpen] = React.useState(true);
  // const [predictionsCloseAt, setPredictionsCloseAt] = React.useState<string | null>(null);
  // const [isLoading, setIsLoading] = React.useState(true);

  const stageOptions = React.useMemo(() => getUniqueStageOptions(matches), [matches]);
  const groupOptions = React.useMemo(() => getUniqueGroupOptions(matches), [matches]);

  const filteredMatches = React.useMemo(() => {
    return filterMatches(matches, filters);
  }, [matches, filters]);

  // React.useEffect(() => {
  //   async function loadPageData() {
  //     if (!user?.id) {
  //       setIsLoading(false);
  //       return;
  //     }

  //     setIsLoading(true);
  //     setErrorMessage('');

  //     try {
  //       const [matchesData, predictionRows, settings] = await Promise.all([
  //         getMatches(),
  //         getPredictionsByUser(user.id),
  //         getAppSettings()
  //       ]);

  //       const nextPredictions = predictionRows.reduce<MatchPredictionMap>((acc, row) => {
  //         acc[row.match_id] = {
  //           homeScore: row.home_score,
  //           awayScore: row.away_score
  //         };
  //         return acc;
  //       }, {});

  //       setMatches(matchesData);
  //       setPredictions(nextPredictions);
  //       setPredictionsOpen(settings?.predictions_open ?? true);
  //       setPredictionsCloseAt(settings?.predictions_close_at ?? null);
  //     } catch (error) {
  //       const message = error instanceof Error ? error.message : 'No se pudieron cargar los partidos';
  //       setErrorMessage(message);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }

  //   void loadPageData();
  // }, [user?.id]);

  const handleOpenPrediction = (match: Match) => {
    const lockMessage = getMatchLockMessage(match, predictionsClosed);

    if (lockMessage) {
      setErrorMessage(lockMessage);
      return;
    }

    setErrorMessage('');
    setSelectedMatch(match);
  };

  const handleClosePrediction = () => {
    setSelectedMatch(null);
  };

  const handleSavePrediction = async (payload: { matchId: string; homeScore: number; awayScore: number }) => {
    if (!user?.id) return;

    const match = matches.find((item) => item.id === payload.matchId);

    if (!match) {
      setErrorMessage('No se encontró el partido.');
      return;
    }

    const lockMessage = getMatchLockMessage(match, predictionsClosed);

    if (lockMessage) {
      setErrorMessage(lockMessage);
      return;
    }

    setErrorMessage('');

    try {
      await upsertPrediction({
        userId: user.id,
        matchId: payload.matchId,
        homeScore: payload.homeScore,
        awayScore: payload.awayScore
      });

      queryClient.setQueryData(
        queryKeys.predictions(user.id),
        (
          prev:
            | Array<{
                id?: string;
                user_id: string;
                match_id: string;
                home_score: number;
                away_score: number;
              }>
            | undefined
        ) => {
          const next = prev ? [...prev] : [];

          const existingIndex = next.findIndex((row) => row.match_id === payload.matchId);

          if (existingIndex >= 0) {
            next[existingIndex] = {
              ...next[existingIndex],
              home_score: payload.homeScore,
              away_score: payload.awayScore
            };
            return next;
          }

          return [
            ...next,
            {
              user_id: user.id,
              match_id: payload.matchId,
              home_score: payload.homeScore,
              away_score: payload.awayScore
            }
          ];
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el pronóstico';
      setErrorMessage(message);
    }
  };

  const handleFilterChange = (field: keyof MatchListFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <Stack spacing={3}>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={1}>
              <Typography variant='h4' fontWeight={800}>
                Partidos
              </Typography>

              <Typography color='text.secondary'>Vista operativa para cargar y editar pronósticos.</Typography>
            </Stack>
          </CardContent>
        </Card>

        {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
        {isError ? (
          <Alert severity='error'>
            {firstError instanceof Error ? firstError.message : 'No se pudieron cargar los partidos'}
          </Alert>
        ) : null}

        {predictionsClosed ? <Alert severity='warning'>La carga de pronósticos está cerrada.</Alert> : null}

        <MatchFiltersCard
          title='Filtrar partidos'
          filters={filters}
          onChange={(field, value) => handleFilterChange(field as keyof MatchListFilters, value)}
          stageOptions={stageOptions}
          groupOptions={groupOptions}
        />

        {filteredMatches.length === 0 && matches.length > 0 ? (
          <Alert severity='warning'>No hay partidos que coincidan con los filtros.</Alert>
        ) : null}

        {isLoading ? (
          <Stack alignItems='center' sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : matches.length === 0 ? (
          <Alert severity='info'>No hay partidos cargados todavía.</Alert>
        ) : (
          <Stack spacing={2}>
            {filteredMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                predictionSummary={buildPredictionSummary(predictions[match.id])}
                onPredict={handleOpenPrediction}
                isLocked={isMatchLocked(match, predictionsClosed)}
                lockMessage={getMatchLockMessage(match, predictionsClosed) || undefined}
              />
            ))}
          </Stack>
        )}
      </Stack>

      <PredictionDialog
        open={Boolean(selectedMatch)}
        match={selectedMatch}
        initialHomeScore={selectedPrediction?.homeScore ?? null}
        initialAwayScore={selectedPrediction?.awayScore ?? null}
        onClose={handleClosePrediction}
        onSave={(payload) => {
          void handleSavePrediction(payload);
        }}
      />
    </>
  );
}
