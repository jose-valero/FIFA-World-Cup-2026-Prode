import * as React from 'react';
import {
  Alert,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import { getLeaderboard, type LeaderboardRow } from '../features/leaderboard/leaderboard.api';

export function LeaderboardPage() {
  const [rows, setRows] = React.useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    async function loadLeaderboard() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const data = await getLeaderboard();
        setRows(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el leaderboard';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadLeaderboard();
  }, []);

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
              Tabla global
            </Typography>

            <Typography color='text.secondary'>
              Ranking general de participantes según los resultados oficiales cargados.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

      <Card
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Stack alignItems='center' sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <TableContainer>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>

                    <TableCell>
                      <Typography variant='body2' fontWeight={700}>
                        Usuario
                      </Typography>
                    </TableCell>

                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight={700}>
                        Puntos
                      </Typography>
                    </TableCell>

                    <TableCell align='right'>
                      <Stack spacing={0.25} alignItems='flex-end'>
                        <Typography variant='body2' fontWeight={700}>
                          Exactos
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Marcadores exactos acertados
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align='right'>
                      <Stack spacing={0.25} alignItems='flex-end'>
                        <Typography variant='body2' fontWeight={700}>
                          Aciertos de signo
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          Partidos donde acertaste ganador o empate
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell align='right'>
                      <Typography variant='body2' fontWeight={700}>
                        Partidos evaluados
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.user_id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{row.display_name}</TableCell>
                      <TableCell align='right'>{row.total_points}</TableCell>
                      <TableCell align='right'>{row.exact_hits}</TableCell>
                      <TableCell align='right'>{row.outcome_hits}</TableCell>
                      <TableCell align='right'>{row.scored_predictions}</TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color='text.secondary' sx={{ py: 2 }}>
                          Aún no hay datos suficientes para mostrar el ranking.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
