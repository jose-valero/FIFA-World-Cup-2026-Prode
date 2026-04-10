import * as React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
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

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth/hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { useAdminParticipantsOverview } from '../../admin/participants/hooks/useAdminParticipantsOverview';
import { useSetParticipantDisabled } from '../../admin/participants/hooks/useSetParticipantDisabled';
import { ParticipantAuditDrawer } from '../../audits/components/ParticipantAuditDrawer';
import { ParticipantProfileDrawer } from '../components/ParticipantProfileDrawer';
import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import { getTopThreeAvatars } from '../api/leaderboard.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { LeaderboardRow } from '../types/leaderboard.types';

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

const PODIUM = {
  1: { border: '#D4AF37', bg: 'rgba(212,175,55,0.08)', color: '#B8960C', label: '🥇 #1' },
  2: { border: '#A8A9AD', bg: 'rgba(168,169,173,0.08)', color: '#757575', label: '🥈 #2' },
  3: { border: '#CD7F32', bg: 'rgba(205,127,50,0.08)', color: '#A0522D', label: '🥉 #3' }
} as const;

function getPodiumStyle(position: number) {
  return PODIUM[position as keyof typeof PODIUM] ?? null;
}

function getPodiumLabel(position: number) {
  return getPodiumStyle(position)?.label ?? null;
}

function PodiumCard({
  row,
  position,
  isCurrentUser,
  avatarUrl
}: {
  row: LeaderboardRow;
  position: number;
  isCurrentUser: boolean;
  avatarUrl?: string | null;
}) {
  const podiumStyle = getPodiumStyle(position);
  const podiumLabel = getPodiumLabel(position);

  if (!podiumStyle) return null;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${podiumStyle.border}`,
        background: `linear-gradient(180deg, ${podiumStyle.bg} 0%, transparent 100%)`,
        boxShadow: `0 4px 16px 0 ${podiumStyle.border}28`
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar
              src={avatarUrl ?? undefined}
              sx={{
                width: 52,
                height: 52,
                fontSize: 20,
                fontWeight: 800,
                border: `2px solid ${podiumStyle.border}`,
                boxShadow: `0 0 0 3px ${podiumStyle.bg}`
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

                {podiumLabel ? (
                  <Chip
                    label={podiumLabel}
                    size='small'
                    sx={{
                      borderColor: podiumStyle.border,
                      color: podiumStyle.color,
                      fontWeight: 700
                    }}
                    variant='outlined'
                  />
                ) : null}
                {isCurrentUser ? <Chip label='Tú' size='small' variant='outlined' /> : null}
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Posición #{position}
              </Typography>
            </Box>
          </Stack>

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip
              label={`${row.total_points} pts`}
              size='small'
              variant='outlined'
              sx={{ borderColor: podiumStyle.border, color: podiumStyle.color, fontWeight: 700 }}
            />
            <Chip label={`${row.exact_hits} exactos`} size='small' variant='outlined' />
            <Chip label={`${row.outcome_hits} signo`} size='small' variant='outlined' />
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
  const { user, profile } = useAuth();
  const { data: rows = [], isLoading, isError, error } = useLeaderboard();
  const { data: settings = null } = useAppSettings();

  const isAdmin = Boolean(profile?.is_admin);
  const auditsVisible = settings?.audits_visible ?? false;
  const canInspectPredictions = Boolean(user?.id && auditsVisible);

  const { data: adminOverview = [], isLoading: isAdminOverviewLoading } = useAdminParticipantsOverview(isAdmin);

  const { mutate: setParticipantDisabled, isPending: isSetParticipantDisabledPending } = useSetParticipantDisabled();

  const [selectedParticipant, setSelectedParticipant] = React.useState<LeaderboardRow | null>(null);
  const [profileParticipant, setProfileParticipant] = React.useState<LeaderboardRow | null>(null);

  const activeRows = React.useMemo(() => rows.filter((row) => !row.is_disabled), [rows]);
  const disabledRows = React.useMemo(() => rows.filter((row) => row.is_disabled), [rows]);
  const displayRows = React.useMemo(() => [...activeRows, ...disabledRows], [activeRows, disabledRows]);

  const activePositionMap = React.useMemo(() => {
    return new Map(activeRows.map((row, index) => [row.user_id, index + 1]));
  }, [activeRows]);

  const currentUserPosition = React.useMemo(() => {
    if (!user?.id) return null;

    const index = activeRows.findIndex((row) => row.user_id === user.id);
    return index >= 0 ? index + 1 : null;
  }, [activeRows, user?.id]);

  const leaderPoints = activeRows[0]?.total_points ?? 0;
  const topThree = activeRows.slice(0, 3);

  const topThreeIds = React.useMemo(() => topThree.map((r) => r.user_id), [topThree]);

  const { data: topThreeAvatars = new Map() } = useQuery({
    queryKey: queryKeys.topThreeAvatars(topThreeIds),
    queryFn: () => getTopThreeAvatars(topThreeIds),
    enabled: topThreeIds.length > 0,
    staleTime: 60_000
  });

  const adminMap = React.useMemo(() => {
    return new Map(adminOverview.map((row) => [row.user_id, row]));
  }, [adminOverview]);

  const badges: PageHeaderBadge[] = [
    {
      label: `${activeRows.length} participantes activos`,
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

  const handleOpenParticipantAudit = (row: LeaderboardRow) => {
    setProfileParticipant(null);
    setSelectedParticipant(row);
  };

  const handleCloseParticipantAudit = () => {
    setSelectedParticipant(null);
  };

  const handleOpenProfile = (row: LeaderboardRow) => {
    setSelectedParticipant(null);
    setProfileParticipant(row);
  };

  const handleCloseProfile = () => {
    setProfileParticipant(null);
  };

  const handleSwapToAudit = () => {
    if (!profileParticipant) return;
    setSelectedParticipant(profileParticipant);
    setProfileParticipant(null);
  };

  const handleToggleParticipantStatus = (row: LeaderboardRow) => {
    if (row.user_id === user?.id) return;

    const nextDisabledValue = !row.is_disabled;
    const actionLabel = nextDisabledValue ? 'deshabilitar' : 'habilitar';

    const confirmed = window.confirm(`¿Seguro que quieres ${actionLabel} a ${row.display_name}?`);

    if (!confirmed) return;

    setParticipantDisabled({
      userId: row.user_id,
      isDisabled: nextDisabledValue
    });
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Tabla global'
        description='Ranking general de participantes según los resultados oficiales cargados.'
        badges={badges}
      />

      {canInspectPredictions ? (
        <Alert severity='info'>
          Abre el detalle de cualquier participante para revisar sus pronósticos por etapa o grupo.
        </Alert>
      ) : null}

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
              <Typography variant='h5' fontWeight={800}>
                Top 3
              </Typography>

              <Grid container spacing={1.5}>
                {topThree.map((row, index) => (
                  <Grid key={row.user_id} size={{ xs: 12, md: 4 }}>
                    <PodiumCard
                      row={row}
                      position={index + 1}
                      isCurrentUser={Boolean(user?.id && row.user_id === user.id)}
                      avatarUrl={topThreeAvatars.get(row.user_id) ?? null}
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
                <Table sx={{ minWidth: isAdmin ? 1060 : 840 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>

                      <TableCell>
                        <Typography variant='body2' fontWeight={700}>
                          Participante
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
                            Pronósticos
                          </Typography>
                        </TableCell>
                      ) : null}

                      {isAdmin ? (
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={700}>
                            Cuenta
                          </Typography>
                        </TableCell>
                      ) : null}

                      {isAdmin ? (
                        <TableCell align='right'>
                          <Typography variant='body2' fontWeight={700}>
                            Acción
                          </Typography>
                        </TableCell>
                      ) : null}

                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={700}>
                          Estado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {displayRows.map((row, index) => {
                      const previousRow = displayRows[index - 1];
                      const startsDisabledSection = row.is_disabled && !previousRow?.is_disabled;

                      const adminRow = adminMap.get(row.user_id);
                      const isDisabledRow = Boolean(row.is_disabled);
                      const position = isDisabledRow ? null : (activePositionMap.get(row.user_id) ?? null);
                      const isCurrentUser = Boolean(user?.id && row.user_id === user.id);

                      return (
                        <React.Fragment key={row.user_id}>
                          {startsDisabledSection ? (
                            <TableRow>
                              <TableCell colSpan={isAdmin ? 10 : canInspectPredictions ? 8 : 7} align='center'>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                  sx={{ px: 2, py: 1.5, fontWeight: 700 }}
                                >
                                  Participantes deshabilitados
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : null}

                          <TableRow
                            hover
                            sx={(theme) => ({
                              opacity: isDisabledRow ? 0.58 : 1,
                              bgcolor: isCurrentUser
                                ? alpha(theme.palette.info.main, 0.08)
                                : isDisabledRow
                                  ? alpha(theme.palette.action.disabledBackground, 0.45)
                                  : undefined,
                              '& td': {
                                color: isDisabledRow ? theme.palette.text.disabled : undefined
                              },
                              '& td:first-of-type': {
                                borderLeft: '4px solid',
                                borderLeftColor: isDisabledRow
                                  ? theme.palette.action.disabled
                                  : ((position ? getPodiumStyle(position)?.border : null) ?? 'transparent'),
                                pl: 1.5
                              }
                            })}
                          >
                            <TableCell>
                              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                                {position ? (
                                  <Typography fontWeight={800}>#{position}</Typography>
                                ) : (
                                  <Typography fontWeight={800}>—</Typography>
                                )}

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
                                  onClick={() => handleOpenProfile(row)}
                                  fontWeight={isCurrentUser ? 800 : 700}
                                  sx={{
                                    cursor: 'pointer',
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
                              <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                                <Button size='small' variant='outlined' onClick={() => handleOpenParticipantAudit(row)}>
                                  Ver pronósticos
                                </Button>
                              </TableCell>
                            ) : null}

                            {isAdmin ? (
                              <TableCell align='right'>
                                {isAdminOverviewLoading ? (
                                  <Chip label='Cargando...' size='small' variant='outlined' />
                                ) : adminRow ? (
                                  <Chip
                                    label={adminRow.email_confirmed ? 'Verificada' : 'Pendiente'}
                                    size='small'
                                    color={adminRow.email_confirmed ? 'success' : 'warning'}
                                    variant='outlined'
                                  />
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            ) : null}

                            {isAdmin ? (
                              <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                                {adminRow?.user_id === user?.id ? (
                                  <Chip label='Tu cuenta' size='small' variant='outlined' />
                                ) : (
                                  <Button
                                    size='small'
                                    variant='outlined'
                                    color={row.is_disabled ? 'success' : 'warning'}
                                    disabled={isSetParticipantDisabledPending}
                                    onClick={() => handleToggleParticipantStatus(row)}
                                  >
                                    {row.is_disabled ? 'Habilitar' : 'Deshabilitar'}
                                  </Button>
                                )}
                              </TableCell>
                            ) : null}

                            <TableCell align='right'>
                              {row.is_disabled ? (
                                <Chip label='Deshabilitado' size='small' color='default' variant='outlined' />
                              ) : (
                                <Chip label='Activo' size='small' color='success' variant='outlined' />
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}

                    {displayRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 10 : canInspectPredictions ? 8 : 7}>
                          <Typography color='text.secondary' sx={{ py: 2, px: 2 }}>
                            Aún no hay datos suficientes para mostrar el ranking.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </TableContainer>

              {displayRows.length > 0 ? <Divider /> : null}

              {displayRows.length > 0 ? (
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

      <ParticipantProfileDrawer
        open={Boolean(profileParticipant)}
        onClose={handleCloseProfile}
        participant={profileParticipant}
        position={profileParticipant ? (activePositionMap.get(profileParticipant.user_id) ?? null) : null}
        canInspectPredictions={canInspectPredictions}
        onOpenAudit={handleSwapToAudit}
      />

      <ParticipantAuditDrawer
        open={Boolean(selectedParticipant)}
        onClose={handleCloseParticipantAudit}
        participant={selectedParticipant}
        auditsVisible={auditsVisible}
      />
    </Stack>
  );
}
