import * as React from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useAppSettings } from '../features/settings/useAppSettings';
import { useUpdateAppSettings } from '../features/settings/useUpdateAppSettings';

export function AdminSettingsPage() {
  const { data: settings = null, isLoading, isError, error } = useAppSettings();

  const updateAppSettingsMutation = useUpdateAppSettings();

  const [predictionsOpen, setPredictionsOpen] = React.useState(true);
  const [predictionsCloseAt, setPredictionsCloseAt] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    setPredictionsOpen(settings?.predictions_open ?? true);
    setPredictionsCloseAt(settings?.predictions_close_at ? settings.predictions_close_at.slice(0, 16) : '');
  }, [settings]);

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateAppSettingsMutation.mutateAsync({
        predictionsOpen,
        predictionsCloseAt: predictionsCloseAt ? new Date(predictionsCloseAt).toISOString() : null
      });

      setSuccessMessage('Configuración guardada correctamente.');
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'No se pudo guardar la configuración';
      setErrorMessage(message);
    }
  };

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1}>
            <Typography variant='h4' fontWeight={800}>
              Admin · Configuración de la quiniela
            </Typography>

            <Typography color='text.secondary'>
              Controla si la carga de pronósticos está abierta y define una fecha límite global.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
      {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

      {isError ? (
        <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudo cargar la configuración'}</Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={3}>
              <FormControlLabel
                control={
                  <Switch checked={predictionsOpen} onChange={(event) => setPredictionsOpen(event.target.checked)} />
                }
                label='Pronósticos abiertos'
              />

              <TextField
                label='Fecha límite global'
                type='datetime-local'
                value={predictionsCloseAt}
                onChange={(event) => setPredictionsCloseAt(event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <Stack direction='row' spacing={2}>
                <Button
                  variant='contained'
                  onClick={() => void handleSave()}
                  disabled={updateAppSettingsMutation.isPending}
                >
                  Guardar configuración
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
