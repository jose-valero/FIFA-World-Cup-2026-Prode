import * as React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha
} from '@mui/material';
import { getLeaderboard, type LeaderboardRow } from '../features/leaderboard/leaderboard.api';
import { useAuth } from '../features/auth/useAuth';

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>

          <Typography variant='h4' fontWeight={800}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function PodiumCard({
  row,
  position,
  isCurrentUser
}: {
  row: LeaderboardRow;
  position: number;
  isCurrentUser: boolean;
}) {
  const isLeader = position === 1;

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor: isLeader ? 'primary.main' : 'divider',
        background: isLeader
          ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 100%)`
          : undefined
      })}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar
              sx={{
                width: 44,
                height: 44,
                fontWeight: 800
              }}
            >
              {getInitial(row.display_name)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Typography
                  variant='h6'
                  fontWeight={800}
                  sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.display_name}
                </Typography>

                {isCurrentUser ? <Chip label='Tú' size='small' color='primary' /> : null}
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Posición #{position}
              </Typography>
            </Box>
          </Stack>

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip label={`${row.total_points} pts`} color={isLeader ? 'primary' : 'default'} />
            <Chip label={`${row.exact_hits} exactos`} variant='outlined' />
            <Chip label={`${row.outcome_hits} signo`} variant='outlined' />
          </Stack>

          <Typography variant='body2' color='text.secondary'>
            Partidos evaluados: {row.scored_predictions}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function LeaderboardPage() {
  const { user } = useAuth();

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

  const currentUserPosition = React.useMemo(() => {
    if (!user?.id) return null;

    const index = rows.findIndex((row) => row.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [rows, user?.id]);

  const leaderPoints = rows[0]?.total_points ?? 0;
  const topThree = rows.slice(0, 3);

  return (
    <Stack spacing={3}>
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
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

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard label='Participantes' value={rows.length} />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard label='Puntaje líder' value={`${leaderPoints} pts`} />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <StatCard label='Tu posición' value={currentUserPosition ? `#${currentUserPosition}` : '-'} />
            </Grid>
          </Grid>

          {topThree.length > 0 ? (
            <Stack spacing={2}>
              <Typography variant='h5' fontWeight={800}>
                Top 3
              </Typography>

              <Grid container spacing={2}>
                {topThree.map((row, index) => (
                  <Grid key={row.user_id} size={{ xs: 12, md: 4 }}>
                    <PodiumCard
                      row={row}
                      position={index + 1}
                      isCurrentUser={Boolean(user?.id && row.user_id === user.id)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          ) : null}

          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <CardContent sx={{ p: 0 }}>
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
                        <Typography variant='body2' fontWeight={700}>
                          Exactos
                        </Typography>
                      </TableCell>

                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={700}>
                          Aciertos de signo
                        </Typography>
                      </TableCell>

                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={700}>
                          Partidos evaluados
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row, index) => {
                      const position = index + 1;
                      const isCurrentUser = Boolean(user?.id && row.user_id === user.id);
                      const isTopThree = position <= 3;

                      return (
                        <TableRow
                          key={row.user_id}
                          hover
                          sx={(theme) => ({
                            bgcolor: isCurrentUser ? alpha(theme.palette.primary.main, 0.08) : undefined,
                            '& td:first-of-type': {
                              borderLeft: '4px solid',
                              borderLeftColor: isCurrentUser
                                ? 'primary.main'
                                : isTopThree
                                  ? 'warning.main'
                                  : 'transparent',
                              pl: 1.5
                            }
                          })}
                        >
                          <TableCell>
                            <Stack direction='row' spacing={1} alignItems='center'>
                              <Typography fontWeight={800}>#{position}</Typography>
                              {isCurrentUser ? <Chip label='Tú' size='small' color='primary' /> : null}
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Stack direction='row' spacing={1.5} alignItems='center'>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  fontSize: 14,
                                  fontWeight: 800
                                }}
                              >
                                {getInitial(row.display_name)}
                              </Avatar>

                              <Typography
                                fontWeight={isCurrentUser ? 800 : 700}
                                sx={{
                                  maxWidth: { xs: 120, sm: 220 },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {row.display_name}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell align='right'>
                            <Chip
                              label={`${row.total_points} pts`}
                              color={position === 1 ? 'primary' : 'default'}
                              variant={position === 1 ? 'filled' : 'outlined'}
                              size='small'
                            />
                          </TableCell>

                          <TableCell align='right'>{row.exact_hits}</TableCell>
                          <TableCell align='right'>{row.outcome_hits}</TableCell>
                          <TableCell align='right'>{row.scored_predictions}</TableCell>
                        </TableRow>
                      );
                    })}

                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <Typography color='text.secondary' sx={{ py: 2, px: 2 }}>
                            Aún no hay datos suficientes para mostrar el ranking.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>

              {rows.length > 0 ? <Divider /> : null}

              {rows.length > 0 ? (
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography variant='body2' color='text.secondary'>
                    El ranking se ordena por puntos totales, luego por exactos y después por nombre.
                  </Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}
