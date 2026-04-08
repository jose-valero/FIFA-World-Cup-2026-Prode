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
import { useAuth } from '../../auth/hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import type { LeaderboardRow } from '../api/leaderboard.api';

import { Button } from '@mui/material';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { ParticipantAuditDrawer } from '../../audits/components/ParticipantAuditDrawer';

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

function getPodiumColor(position: number): 'success' | 'info' | 'warning' | 'default' {
  switch (position) {
    case 1:
      return 'success';
    case 2:
      return 'info';
    case 3:
      return 'warning';
    default:
      return 'default';
  }
}

function getPodiumLabel(position: number) {
  switch (position) {
    case 1:
      return 'Top 1';
    case 2:
      return 'Top 2';
    case 3:
      return 'Top 3';
    default:
      return null;
  }
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
  const podiumColor = getPodiumColor(position);
  const podiumLabel = getPodiumLabel(position);

  return (
    <Card
      elevation={0}
      sx={(theme) => ({
        height: '100%',
        borderRadius: 2,
        border: '1px solid',
        borderColor:
          position === 1 ? 'success.main' : position === 2 ? 'info.main' : position === 3 ? 'warning.main' : 'divider',
        background:
          position === 1
            ? `linear-gradient(180deg, ${alpha(theme.palette.success.main, 0.12)} 0%, transparent 100%)`
            : position === 2
              ? `linear-gradient(180deg, ${alpha(theme.palette.info.main, 0.12)} 0%, transparent 100%)`
              : position === 3
                ? `linear-gradient(180deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, transparent 100%)`
                : undefined
      })}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar
              sx={(theme) => ({
                width: 44,
                height: 44,
                fontWeight: 800,
                border: '2px solid',
                borderColor:
                  position === 1
                    ? theme.palette.success.main
                    : position === 2
                      ? theme.palette.info.main
                      : position === 3
                        ? theme.palette.warning.main
                        : theme.palette.divider,
                boxShadow:
                  position === 1
                    ? `0 0 0 4px ${alpha(theme.palette.success.main, 0.12)}`
                    : position === 2
                      ? `0 0 0 4px ${alpha(theme.palette.info.main, 0.12)}`
                      : position === 3
                        ? `0 0 0 4px ${alpha(theme.palette.warning.main, 0.12)}`
                        : 'none'
              })}
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

                {podiumLabel ? <Chip label={podiumLabel} size='small' color={podiumColor} /> : null}
                {isCurrentUser ? <Chip label='Tú' size='small' variant='outlined' /> : null}
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Posición #{position}
              </Typography>
            </Box>
          </Stack>

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip label={`${row.total_points} pts`} color={podiumColor} variant='outlined' />
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
  const { data: rows = [], isLoading, isError, error } = useLeaderboard();
  const { data: settings = null } = useAppSettings();

  const auditsVisible = settings?.audits_visible ?? false;
  const canInspectPredictions = Boolean(user?.id && auditsVisible);

  const [selectedParticipant, setSelectedParticipant] = React.useState<LeaderboardRow | null>(null);

  const handleOpenParticipantAudit = (row: LeaderboardRow) => {
    setSelectedParticipant(row);
  };

  const handleCloseParticipantAudit = () => {
    setSelectedParticipant(null);
  };

  const currentUserPosition = React.useMemo(() => {
    if (!user?.id) return null;

    const index = rows.findIndex((row) => row.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [rows, user?.id]);

  const leaderPoints = rows[0]?.total_points ?? 0;
  const topThree = rows.slice(0, 3);

  const badges: PageHeaderBadge[] = [
    {
      label: `${rows.length} participantes`,
      color: 'primary',
      variant: 'outlined'
    },
    {
      label: `Líder: ${leaderPoints} pts`,
      color: 'primary',
      variant: 'filled'
    },
    {
      label: `Tu posición: ${currentUserPosition ? `#${currentUserPosition}` : '-'}`,
      color: 'default',
      variant: 'outlined'
    }
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Tabla global'
        description='Ranking general de participantes según los resultados oficiales cargados.'
        badges={badges}
      />

      {isError ? (
        <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudo cargar el leaderboard'}</Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <>
          {topThree.length > 0 ? (
            <Stack spacing={1.5}>
              <Grid container spacing={1.5}>
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

          {/* Tabla de clasificacion */}
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
                      {canInspectPredictions ? (
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={700}>
                            Auditoria
                          </Typography>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {rows.map((row, index) => {
                      const position = index + 1;
                      const isCurrentUser = Boolean(user?.id && row.user_id === user.id);

                      return (
                        <TableRow
                          key={row.user_id}
                          hover
                          sx={(theme) => ({
                            bgcolor: isCurrentUser ? alpha(theme.palette.info.main, 0.08) : undefined,
                            '& td:first-of-type': {
                              borderLeft: '4px solid',
                              borderLeftColor:
                                position === 1
                                  ? 'success.main'
                                  : position === 2
                                    ? 'info.main'
                                    : position === 3
                                      ? 'warning.main'
                                      : 'transparent',
                              pl: 1.5
                            }
                          })}
                        >
                          <TableCell>
                            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                              <Typography fontWeight={800}>#{position}</Typography>

                              {getPodiumLabel(position) ? (
                                <Chip label={getPodiumLabel(position)} size='small' color={getPodiumColor(position)} />
                              ) : null}

                              {isCurrentUser ? <Chip label='Tú' size='small' variant='outlined' /> : null}
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
                          {canInspectPredictions ? (
                            <TableCell align='right' colSpan={canInspectPredictions ? 7 : 6}>
                              <Button size='small' variant='outlined' onClick={() => handleOpenParticipantAudit(row)}>
                                Ver pronósticos
                              </Button>
                            </TableCell>
                          ) : null}
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
          <ParticipantAuditDrawer
            open={Boolean(selectedParticipant)}
            onClose={handleCloseParticipantAudit}
            participant={selectedParticipant}
            auditsVisible={auditsVisible}
          />
        </>
      )}
    </Stack>
  );
}
