import * as React from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
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
import { useSearchParams } from 'react-router';

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
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMatchId = searchParams.get('matchId');
  const handledRequestedMatchIdRef = React.useRef<string | null>(null);

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

  const stageOptions = React.useMemo(() => getUniqueStageOptions(matches), [matches]);
  const groupOptions = React.useMemo(() => getUniqueGroupOptions(matches), [matches]);

  const filteredMatches = React.useMemo(() => {
    return filterMatches(matches, filters);
  }, [matches, filters]);

  React.useEffect(() => {
    if (!requestedMatchId) {
      handledRequestedMatchIdRef.current = null;
      return;
    }

    if (isLoading) return;
    if (handledRequestedMatchIdRef.current === requestedMatchId) return;

    const match = matches.find((item) => item.id === requestedMatchId);

    if (!match) {
      setErrorMessage('No se encontró el partido solicitado.');
      handledRequestedMatchIdRef.current = requestedMatchId;
      clearRequestedMatchParam();
      return;
    }

    const lockMessage = getMatchLockMessage(match, predictionsClosed);

    if (lockMessage) {
      setErrorMessage(lockMessage);
      handledRequestedMatchIdRef.current = requestedMatchId;
      clearRequestedMatchParam();
      return;
    }

    setErrorMessage('');
    setSelectedMatch(match);
    handledRequestedMatchIdRef.current = requestedMatchId;
  }, [requestedMatchId, isLoading, matches, predictionsClosed]);

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
    clearRequestedMatchParam();
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

  const clearRequestedMatchParam = React.useCallback(() => {
    if (!requestedMatchId) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('matchId');
    setSearchParams(nextParams, { replace: true });
  }, [requestedMatchId, searchParams, setSearchParams]);

  return (
    <>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant='h5' fontWeight={800}>
            Partidos
          </Typography>

          <Typography variant='body2' color='text.secondary'>
            Elige un partido para cargar o editar tu pronóstico.
          </Typography>
        </Stack>

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
          collapsible
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
