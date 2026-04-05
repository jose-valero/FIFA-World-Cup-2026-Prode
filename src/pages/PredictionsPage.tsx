import * as React from 'react';
import { Alert, Card, CardContent, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { useAuth } from '../features/auth/useAuth';
import { getPredictionsByUser } from '../features/predictions/predictions.api';
import { getMatches } from '../features/matches/matches.api';
import type { Match } from '../features/matches/types';

export function PredictionsPage() {
  const { user } = useAuth();

  const [matches, setMatches] = React.useState<Match[]>([]);
  const [predictions, setPredictions] = React.useState<
    Array<{
      matchId: string;
      homeScore: number;
      awayScore: number;
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage('');

      try {
        const [matchesData, predictionRows] = await Promise.all([getMatches(), getPredictionsByUser(user.id)]);

        setMatches(matchesData);
        setPredictions(
          predictionRows.map((row) => ({
            matchId: row.match_id,
            homeScore: row.home_score,
            awayScore: row.away_score
          }))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudieron cargar tus pronósticos';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [user?.id]);

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
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant='h4' fontWeight={800}>
              Mis pronósticos
            </Typography>

            <Typography color='text.secondary'>Aquí verás todos los resultados que ya guardaste.</Typography>
          </Stack>

          {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

          {isLoading ? (
            <Stack alignItems='center' sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : predictions.length === 0 ? (
            <Typography color='text.secondary'>Aún no has cargado ningún pronóstico.</Typography>
          ) : (
            <Stack spacing={2}>
              {predictions.map((prediction) => {
                const match = matches.find((item) => item.id === prediction.matchId);

                return (
                  <Stack key={prediction.matchId} spacing={1.5}>
                    <Typography fontWeight={700}>
                      {match ? `${match.homeTeam} vs ${match.awayTeam}` : `Partido ${prediction.matchId}`}
                    </Typography>

                    <Typography color='text.secondary'>
                      Pronóstico: {prediction.homeScore} - {prediction.awayScore}
                    </Typography>

                    <Divider />
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
