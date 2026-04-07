import * as React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { usePredictionsByUser } from '../hooks/usePredictionsByUser';
import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import { isPredictionsClosed } from '../../../shared/utils/isPredictionsClosed';
import { getPredictionViewFromPath } from '../utils/getPredictionViewFromPath';
import type { PredictionView } from '../types/predictions.types';
import { routes } from '../../../app/router/routes';

export function PredictionsHubPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: settings = null } = useAppSettings();
  const { data: predictionRows = [] } = usePredictionsByUser(user?.id!);

  const currentView = getPredictionViewFromPath(location.pathname);

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const badges: PageHeaderBadge[] = [
    {
      label: predictionsClosed ? 'Pronósticos cerrados' : 'Pronósticos abiertos',
      color: predictionsClosed ? 'warning' : 'success',
      variant: predictionsClosed ? 'outlined' : 'filled'
    },
    {
      label: `${predictionRows.length} cargados`,
      color: 'primary',
      variant: 'outlined'
    }
  ];

  if (settings?.predictions_close_at) {
    badges.push({
      label: `Cierre: ${new Date(settings.predictions_close_at).toLocaleDateString('es-AR')}`,
      color: 'default',
      variant: 'outlined'
    });
  }

  const handleChangeView = (_: React.MouseEvent<HTMLElement>, value: PredictionView | null) => {
    if (!value) return;

    navigate(value === 'matches' ? routes.predictionMatches : routes.myPredictions);
  };

  return (
    <>
      <PageHeader
        title='Carga tu pronóstico'
        description='Carga tus resultados partido a partido y revisa tus pronósticos guardados dentro de la misma sección.'
        badges={badges}
        tabs={
          <Box sx={{ overflowX: 'auto', pb: 0.25 }}>
            <ToggleButtonGroup
              value={currentView}
              exclusive
              onChange={handleChangeView}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <ToggleButton value='matches' sx={{ borderRadius: 999, px: 2 }} color='primary'>
                Partidos
              </ToggleButton>

              <ToggleButton value='my-predictions' sx={{ borderRadius: 999, px: 2 }} color='primary'>
                Mis pronósticos
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        }
        sx={{ mb: 3 }}
      />

      <Outlet />
    </>
  );
}
