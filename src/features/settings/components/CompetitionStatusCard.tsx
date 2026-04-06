// import * as React from 'react';
import { Alert, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { useAppSettings } from '../useAppSettings';
import { useMatches } from '../../matches/useMatches';

function formatCloseDate(value: string | null) {
  if (!value) return 'Sin fecha límite definida';

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

function getCurrentPhase(matches: Array<{ stage: string; status: string }>) {
  if (matches.length === 0) {
    return 'Sin partidos cargados';
  }

  const hasLiveKnockout = matches.some((match) => match.stage !== 'group_stage' && match.status !== 'scheduled');

  if (hasLiveKnockout) {
    return 'Eliminación';
  }

  const hasKnockoutMatches = matches.some((match) => match.stage !== 'group_stage');

  if (hasKnockoutMatches) {
    return 'Eliminación';
  }

  return 'Grupos';
}

export function CompetitionStatusCard() {
  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const isLoading = isSettingsLoading || isMatchesLoading;
  const isError = isSettingsError || isMatchesError;
  const firstError = settingsError || matchesError;

  const predictionsOpen = settings?.predictions_open ?? true;
  const predictionsCloseAt = settings?.predictions_close_at ?? null;
  const closed = isPredictionsClosed(predictionsOpen, predictionsCloseAt);
  const currentPhase = getCurrentPhase(matches);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Stack spacing={2}>
          <Stack spacing={1}>
            <Typography variant='h5' fontWeight={800}>
              Estado de la quiniela
            </Typography>

            <Typography color='text.secondary'>
              Consulta si la carga de pronósticos está abierta y la fecha límite actual.
            </Typography>
          </Stack>

          {isLoading ? (
            <Stack alignItems='center' sx={{ py: 2 }}>
              <CircularProgress />
            </Stack>
          ) : isError ? (
            <Alert severity='error'>
              {firstError instanceof Error ? firstError.message : 'No se pudo cargar el estado de la quiniela'}
            </Alert>
          ) : (
            <Stack spacing={2}>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip
                  label={closed ? 'Pronósticos cerrados' : 'Pronósticos abiertos'}
                  color={closed ? 'warning' : 'primary'}
                />
                <Chip label={`Fase actual: ${currentPhase}`} variant='outlined' color='primary' />
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Fecha límite: {formatCloseDate(predictionsCloseAt)}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
