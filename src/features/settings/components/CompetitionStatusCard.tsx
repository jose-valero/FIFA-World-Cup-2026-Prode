import * as React from 'react';
import { Alert, Card, CardContent, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { getAppSettings } from '../appSettings.api';

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

export function CompetitionStatusCard() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [predictionsOpen, setPredictionsOpen] = React.useState(true);
  const [predictionsCloseAt, setPredictionsCloseAt] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const settings = await getAppSettings();
        setPredictionsOpen(settings?.predictions_open ?? true);
        setPredictionsCloseAt(settings?.predictions_close_at ?? null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el estado de la quiniela';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const closed = isPredictionsClosed(predictionsOpen, predictionsCloseAt);

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
          ) : errorMessage ? (
            <Alert severity='error'>{errorMessage}</Alert>
          ) : (
            <Stack spacing={2}>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip
                  label={closed ? 'Pronósticos cerrados' : 'Pronósticos abiertos'}
                  color={closed ? 'warning' : 'primary'}
                />
                <Chip label='Fase actual: Grupos' variant='outlined' color={'primary'} />
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
