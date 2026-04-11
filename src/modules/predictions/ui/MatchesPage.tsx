import * as React from 'react';
import { Alert, CircularProgress, Snackbar, Stack } from '@mui/material';
import { MatchCard } from '../../matches/components/MatchCard';
import { PredictionDialog } from '../components/PredictionDialog';
import { ConfirmDeleteDialog } from '../../../shared/components/ConfirmDeleteDialog';
import { deletePrediction, upsertPrediction } from '../api/predictions.api';
import { useAuth } from '../../auth/hooks/useAuth';
import { MatchFiltersCard } from '../../../shared/components/MatchFiltersCard';
import {
  filterMatches,
  getUniqueGroupOptions,
  getUniqueStageOptions,
  matchStatusOptions,
  type MatchListFilters
} from '../../matches/utils/listFilters';
import { useQueryClient } from '@tanstack/react-query';
import { useMatches } from '../../matches/hooks/useMatches';
import { usePredictionsByUser } from '../hooks/usePredictionsByUser';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import { useSearchParams } from 'react-router';
import { getMatchLockMessage } from '../utils/getMatchLockMessage';
import { isMatchLocked } from '../utils/isMatchLocked';
import { isPredictionsClosed } from '../../../shared/utils/isPredictionsClosed';
import { buildPredictionSummary } from '../utils/buildPredictionSummary';
import type { Match } from '../../matches/types/types';
import { sortMatchesByStatusPriority } from '../../../shared/utils/sortMatchesByStatusPriority';

type MatchPredictionMap = Record<
  string,
  {
    homeScore: number;
    awayScore: number;
  }
>;

export function MatchesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMatchId = searchParams.get('matchId');
  const handledRequestedMatchIdRef = React.useRef<string | null>(null);

  const [selectedMatch, setSelectedMatch] = React.useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = React.useState<Match | null>(null);
  const [isDeletingPrediction, setIsDeletingPrediction] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [filters, setFilters] = React.useState<MatchListFilters>({
    stage: '',
    groupCode: '',
    teamQuery: '',
    status: ''
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
    return sortMatchesByStatusPriority(filterMatches(matches, filters));
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
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditPredictions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el pronóstico';
      setErrorMessage(message);
    }
  };

  const handleDeletePrediction = async (matchId: string, showToast = false) => {
    if (!user?.id) return;

    const match = matches.find((item) => item.id === matchId);

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
      await deletePrediction({
        userId: user.id,
        matchId
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
          if (!prev) return [];
          return prev.filter((row) => row.match_id !== matchId);
        }
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.auditPredictions });

      if (showToast) {
        setSnackbar({ open: true, message: 'Pronóstico eliminado correctamente', severity: 'success' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo limpiar el pronóstico';
      if (showToast) {
        setSnackbar({ open: true, message, severity: 'error' });
      } else {
        setErrorMessage(message);
      }
    }
  };

  const handleFilterChange = (field: keyof MatchListFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClearPredictionFromCard = (match: Match) => {
    setMatchToDelete(match);
  };

  const handleConfirmDelete = async () => {
    if (!matchToDelete) return;
    setIsDeletingPrediction(true);
    await handleDeletePrediction(matchToDelete.id, true);
    setIsDeletingPrediction(false);
    setMatchToDelete(null);
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
          statusOptions={[...matchStatusOptions]}
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
                onClearPrediction={handleClearPredictionFromCard}
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
        onDelete={(matchId) => {
          void handleDeletePrediction(matchId);
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(matchToDelete)}
        title='Limpiar pronóstico'
        description={
          matchToDelete
            ? `¿Seguro que quieres limpiar tu pronóstico para ${matchToDelete.homeTeam} vs ${matchToDelete.awayTeam}?`
            : undefined
        }
        confirmLabel='Limpiar'
        isLoading={isDeletingPrediction}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setMatchToDelete(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
