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
import { getAppSettings, updateAppSettings } from '../features/settings/appSettings.api';

export function AdminSettingsPage() {
  const [predictionsOpen, setPredictionsOpen] = React.useState(true);
  const [predictionsCloseAt, setPredictionsCloseAt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const settings = await getAppSettings();

        setPredictionsOpen(settings?.predictions_open ?? true);
        setPredictionsCloseAt(settings?.predictions_close_at ? settings.predictions_close_at.slice(0, 16) : '');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar la configuración';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateAppSettings({
        predictionsOpen,
        predictionsCloseAt: predictionsCloseAt ? new Date(predictionsCloseAt).toISOString() : null
      });

      setSuccessMessage('Configuración guardada correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar la configuración';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
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

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
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
                InputLabelProps={{ shrink: true }}
                helperText='Opcional. Si la fecha ya pasó, la carga quedará cerrada.'
              />

              <Button
                variant='contained'
                onClick={() => void handleSave()}
                disabled={isSaving}
                sx={{ alignSelf: 'flex-start' }}
              >
                Guardar configuración
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}
