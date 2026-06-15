import * as React from 'react';
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Grid, Snackbar, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { useAdminParticipantsOverview } from '../../admin/participants/hooks/useAdminParticipantsOverview';
import { useSetParticipantDisabled } from '../../admin/participants/hooks/useSetParticipantDisabled';
import { ParticipantAuditDrawer } from '../../audits/components/ParticipantAuditDrawer';
import { ParticipantProfileDrawer } from '../components/ParticipantProfileDrawer';
import { useMatches } from '../../matches/hooks/useMatches';
import { useAuditPredictionsByMatch } from '../../audits/hooks/useAuditPredictionsByMatch';
import { useReactionsByMatch } from '../hooks/useReactionsByMatch';
import { useIncrementMaranita } from '../hooks/useIncrementMaranita';
import type { InlinePrediction } from '../types/leaderboard.types';
// import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import { getTopThreeAvatars } from '../api/leaderboard.api';
import { queryKeys } from '../../../lib/react-query/queryKeys';
import type { LeaderboardRow } from '../types/leaderboard.types';
import { PodiumCard } from '../components/PodiumCard';
import { BottomThreeSection } from '../components/BottomThreeSection';
import { LeaderboardTable } from '../components/table/LeaderboardTable';
import { buildLeaderboardRanks } from '../utils/buildLeaderboardRanks';

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
  const displayRows = React.useMemo(
    () => (isAdmin ? [...activeRows, ...disabledRows] : activeRows),
    [isAdmin, activeRows, disabledRows]
  );

  const activePositionMap = React.useMemo(() => buildLeaderboardRanks(activeRows), [activeRows]);

  const tiedPositions = React.useMemo(() => {
    const posCount = new Map<number, number>();
    for (const rank of activePositionMap.values()) {
      posCount.set(rank, (posCount.get(rank) ?? 0) + 1);
    }
    const tied = new Set<number>();
    for (const [rank, count] of posCount) {
      if (count > 1) tied.add(rank);
    }
    return tied;
  }, [activePositionMap]);

  // const currentUserPosition = React.useMemo(() => {
  //   if (!user?.id) return null;
  //   return activePositionMap.get(user.id) ?? null;
  // }, [activePositionMap, user?.id]);

  // const leaderPoints = activeRows[0]?.total_points ?? 0;
  const topThree = activeRows.slice(0, 3);
  const bottomThree = React.useMemo(() => (activeRows.length > 3 ? activeRows.slice(-3) : []), [activeRows]);
  const bottomThreeIds = React.useMemo(() => new Set(bottomThree.map((r) => r.user_id)), [bottomThree]);

  const topThreeIds = React.useMemo(() => topThree.map((r) => r.user_id), [topThree]);

  const { data: topThreeAvatars = new Map() } = useQuery({
    queryKey: queryKeys.topThreeAvatars(topThreeIds),
    queryFn: () => getTopThreeAvatars(topThreeIds),
    enabled: topThreeIds.length > 0,
    staleTime: 60_000
  });

  const allUserIds = React.useMemo(() => displayRows.map((r) => r.user_id), [displayRows]);

  const { data: participantAvatars = new Map() } = useQuery({
    queryKey: queryKeys.participantAvatars(allUserIds),
    queryFn: () => getTopThreeAvatars(allUserIds),
    enabled: allUserIds.length > 0,
    staleTime: 60_000
  });

  const adminMap = React.useMemo(() => {
    return new Map(adminOverview.map((row) => [row.user_id, row]));
  }, [adminOverview]);

  const { data: matches = [] } = useMatches();

  const relevantMatch = React.useMemo(() => {
    const live = matches.filter((m) => m.status === 'live');
    if (live.length > 0) return live.sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))[0];
    const now = Date.now();
    return (
      matches
        .filter((m) => m.status === 'scheduled')
        .sort((a, b) => a.kickoffAt.localeCompare(b.kickoffAt))
        .find((m) => new Date(m.kickoffAt).getTime() >= now - 3 * 60 * 60 * 1000) ?? null
    );
  }, [matches]);

  const liveMatchCount = React.useMemo(
    () => matches.filter((m) => m.status === 'live').length,
    [matches]
  );

  const { data: matchPredictionRows = [] } = useAuditPredictionsByMatch(
    relevantMatch?.id ?? null,
    canInspectPredictions && Boolean(relevantMatch)
  );

  const predictionsByUserId = React.useMemo((): Map<string, InlinePrediction> => {
    return new Map(
      matchPredictionRows.map((r) => [r.user_id, { homeScore: r.home_score, awayScore: r.away_score }])
    );
  }, [matchPredictionRows]);

  const isRelevantMatchLive = relevantMatch?.status === 'live';

  const { data: reactionRows = [] } = useReactionsByMatch(
    relevantMatch?.id ?? null,
    isRelevantMatchLive && canInspectPredictions
  );

  const reactionsByReceiver = React.useMemo(() => {
    const map = new Map<string, { total: number; myCount: number }>();
    for (const row of reactionRows) {
      const existing = map.get(row.receiver_id) ?? { total: 0, myCount: 0 };
      map.set(row.receiver_id, {
        total: existing.total + row.count,
        myCount: row.giver_id === user?.id ? row.count : existing.myCount
      });
    }
    return map;
  }, [reactionRows, user?.id]);

  const { mutate: mutateMaranita, isPending: isMaranitaPending } = useIncrementMaranita(
    relevantMatch?.id ?? null
  );

  const alreadyAlertedIds = React.useRef(new Set<string>());
  const [limitSnackbarOpen, setLimitSnackbarOpen] = React.useState(false);

  const handleMaranita = React.useCallback(
    (receiverId: string) => {
      mutateMaranita(
        { receiverId },
        {
          onSuccess: (result) => {
            if (result.ok && result.at_limit && !alreadyAlertedIds.current.has(receiverId)) {
              alreadyAlertedIds.current.add(receiverId);
              setLimitSnackbarOpen(true);
            }
          }
        }
      );
    },
    [mutateMaranita]
  );

  // const badges: PageHeaderBadge[] = [
  //   {
  //     label: `${activeRows.length} participantes activos`,
  //     color: 'primary',
  //     variant: 'outlined'
  //   },
  //   {
  //     label: `Líder: ${leaderPoints} pts`,
  //     color: 'primary',
  //     variant: 'filled'
  //   },
  //   {
  //     label: `Tu posición: ${currentUserPosition ? `#${currentUserPosition}` : '-'}`,
  //     color: 'default',
  //     variant: 'outlined'
  //   }
  // ];

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
      {/* <PageHeader
        title='Tabla global'
        // description='Ranking general de participantes según los resultados oficiales cargados.'
        badges={badges}
      /> */}

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
                {topThree.map((row) => {
                  const position = activePositionMap.get(row.user_id) ?? 1;
                  return (
                    <Grid key={row.user_id} size={{ xs: 12, md: 4 }}>
                      <PodiumCard
                        row={row}
                        position={position}
                        isTied={tiedPositions.has(position)}
                        isCurrentUser={Boolean(user?.id && row.user_id === user.id)}
                        avatarUrl={topThreeAvatars.get(row.user_id) ?? null}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Stack>
          ) : null}

          {bottomThree.length > 0 ? (
            <BottomThreeSection
              rows={bottomThree}
              positionMap={activePositionMap}
              avatarMap={participantAvatars}
              currentUserId={user?.id}
            />
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
                avatarMap={participantAvatars}
                user={user}
                isAdmin={isAdmin}
                canInspectPredictions={canInspectPredictions}
                isAdminOverviewLoading={isAdminOverviewLoading}
                isSetParticipantDisabledPending={isSetParticipantDisabledPending}
                bottomThreeIds={bottomThreeIds}
                relevantMatch={relevantMatch}
                predictionsByUserId={predictionsByUserId}
                liveMatchCount={liveMatchCount}
                reactionsByReceiver={reactionsByReceiver}
                onMaranita={handleMaranita}
                isMaranitaPending={isMaranitaPending}
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

      <Snackbar
        open={limitSnackbarOpen}
        autoHideDuration={3500}
        onClose={() => setLimitSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='warning' variant='filled' onClose={() => setLimitSnackbarOpen(false)}>
          🕯️ Loco, basta de marañitas, pareces brujo
        </Alert>
      </Snackbar>
    </Stack>
  );
}
