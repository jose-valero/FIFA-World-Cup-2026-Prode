import * as React from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Grid, Stack, Typography } from '@mui/material';
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
import { PodiumCard } from '../components/PodiumCard';
import { LeaderboardTable } from '../components/table/LeaderboardTable';

export function LeaderboardPage() {
  const [selectedParticipant, setSelectedParticipant] = React.useState<LeaderboardRow | null>(null);
  const [profileParticipant, setProfileParticipant] = React.useState<LeaderboardRow | null>(null);
  const { user, profile } = useAuth();
  const { data: rows = [], isLoading, isError, error } = useLeaderboard();
  const { data: settings = null } = useAppSettings();

  const isAdmin = Boolean(profile?.is_admin);
  const auditsVisible = settings?.audits_visible ?? false;
  const canInspectPredictions = Boolean(user?.id && auditsVisible);

  const { data: adminOverview = [], isLoading: isAdminOverviewLoading } = useAdminParticipantsOverview(isAdmin);

  const { mutate: setParticipantDisabled, isPending: isSetParticipantDisabledPending } = useSetParticipantDisabled();

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
              <LeaderboardTable
                displayRows={displayRows}
                adminMap={adminMap}
                activePositionMap={activePositionMap}
                user={user}
                isAdmin={isAdmin}
                canInspectPredictions={canInspectPredictions}
                isAdminOverviewLoading={isAdminOverviewLoading}
                isSetParticipantDisabledPending={isSetParticipantDisabledPending}
                handleOpenProfile={handleOpenProfile}
                handleOpenParticipantAudit={handleOpenParticipantAudit}
                handleToggleParticipantStatus={handleToggleParticipantStatus}
              />

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
