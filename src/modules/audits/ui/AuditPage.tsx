import * as React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { MatchVs } from '../../../shared/components/MatchVs';
import {
  filterMatches,
  getUniqueGroupOptions,
  getUniqueStageOptions,
  normalizeText,
  type MatchListFilters
} from '../../matches/utils/listFilters';
import { useMatches } from '../../matches/hooks/useMatches';
import { useLeaderboard } from '../../leaderboard/hooks/useLeaderboard';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import { PageFiltersBar } from '../../../shared/components/PageFiltersBar';
import type { Match } from '../../matches/types/types';
import { useAuditPredictions } from '../hooks/useAuditPredictions';

type AuditStatusFilter = '' | 'live' | 'finished' | 'scheduled';

type LeaderboardLikeRow = {
  user_id: string;
  display_name?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  total_points?: number | null;
  exact_hits?: number | null;
  scored_predictions?: number | null;
  rank?: number | null;
  position?: number | null;
};

type AuditPredictionItem = {
  userId: string;
  participantLabel: string;
  participantMeta: string | null;
  homeScore: number;
  awayScore: number;
  points: number | null;
  isExactHit: boolean;
  isOutcomeHit: boolean;
};

type AuditMatchGroup = {
  match: Match;
  predictions: AuditPredictionItem[];
};

function getStatusLabel(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'En vivo';
    case 'finished':
      return 'Finalizado';
    case 'scheduled':
    default:
      return 'Pendiente';
  }
}

function getStatusColor(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'scheduled':
    default:
      return 'warning';
  }
}

function getPredictionOutcome(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function getPredictionPoints(prediction: { homeScore: number; awayScore: number }, match: Match) {
  if (match.officialHomeScore === null || match.officialAwayScore === null) {
    return {
      points: null,
      isExactHit: false,
      isOutcomeHit: false
    };
  }

  const isExactHit =
    prediction.homeScore === match.officialHomeScore && prediction.awayScore === match.officialAwayScore;

  if (isExactHit) {
    return {
      points: 5,
      isExactHit: true,
      isOutcomeHit: true
    };
  }

  const predictionOutcome = getPredictionOutcome(prediction.homeScore, prediction.awayScore);
  const officialOutcome = getPredictionOutcome(match.officialHomeScore, match.officialAwayScore);
  const isOutcomeHit = predictionOutcome === officialOutcome;

  return {
    points: isOutcomeHit ? 3 : 0,
    isExactHit: false,
    isOutcomeHit
  };
}

function getMatchScoreLabel(match: Match) {
  if (match.officialHomeScore === null || match.officialAwayScore === null) {
    return 'Pendiente';
  }

  return `${match.officialHomeScore} - ${match.officialAwayScore}`;
}

function sortMatches(items: Match[]) {
  return [...items].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

function countActiveFilters(filters: MatchListFilters, statusFilter: AuditStatusFilter, participantQuery: string) {
  return [filters.stage, filters.groupCode, filters.teamQuery, statusFilter, participantQuery].filter(Boolean).length;
}

export function AuditPage() {
  const [filters, setFilters] = React.useState<MatchListFilters>({
    stage: '',
    groupCode: '',
    teamQuery: ''
  });
  const [statusFilter, setStatusFilter] = React.useState<AuditStatusFilter>('');
  const [participantQuery, setParticipantQuery] = React.useState('');

  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const auditsVisible = settings?.audits_visible ?? false;

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: leaderboard = [],
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError
  } = useLeaderboard();

  const {
    data: predictionRows = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError,
    error: predictionsError
  } = useAuditPredictions(auditsVisible);

  const isLoading =
    isSettingsLoading || isMatchesLoading || isLeaderboardLoading || (auditsVisible && isPredictionsLoading);

  const isError = isSettingsError || isMatchesError || isLeaderboardError || (auditsVisible && isPredictionsError);
  const firstError = settingsError || matchesError || leaderboardError || predictionsError;

  const auditableMatchIds = React.useMemo(() => {
    return new Set(predictionRows.map((row) => row.match_id));
  }, [predictionRows]);

  const auditableMatches = React.useMemo(() => {
    return matches.filter((match) => auditableMatchIds.has(match.id));
  }, [matches, auditableMatchIds]);

  const filteredMatches = React.useMemo(() => {
    const base = filterMatches(auditableMatches, filters);

    if (!statusFilter) {
      return sortMatches(base);
    }

    return sortMatches(base.filter((match) => match.status === statusFilter));
  }, [auditableMatches, filters, statusFilter]);

  const stageOptions = React.useMemo(() => getUniqueStageOptions(auditableMatches), [auditableMatches]);
  const groupOptions = React.useMemo(() => getUniqueGroupOptions(auditableMatches), [auditableMatches]);

  const leaderboardRows = leaderboard as LeaderboardLikeRow[];

  const participantMap = React.useMemo(() => {
    return new Map(
      leaderboardRows.map((row) => {
        const label = row.display_name || row.displayName || row.username || row.email || 'Participante';

        const rankValue = row.rank ?? row.position ?? null;
        const pointsValue = row.total_points ?? null;

        const metaParts = [
          rankValue ? `#${rankValue}` : null,
          pointsValue !== null ? `${pointsValue} pts` : null
        ].filter(Boolean);

        return [
          row.user_id,
          {
            label,
            meta: metaParts.length > 0 ? metaParts.join(' · ') : null
          }
        ] as const;
      })
    );
  }, [leaderboardRows]);

  const groupedAudits = React.useMemo<AuditMatchGroup[]>(() => {
    const allowedMatchIds = new Set(filteredMatches.map((match) => match.id));
    const matchMap = new Map(filteredMatches.map((match) => [match.id, match]));
    const grouped = new Map<string, AuditPredictionItem[]>();

    for (const row of predictionRows) {
      if (!allowedMatchIds.has(row.match_id)) continue;

      const match = matchMap.get(row.match_id);
      if (!match) continue;

      const participant = participantMap.get(row.user_id);
      const scoring = getPredictionPoints(
        {
          homeScore: row.home_score,
          awayScore: row.away_score
        },
        match
      );

      const item: AuditPredictionItem = {
        userId: row.user_id,
        participantLabel: participant?.label ?? 'Participante',
        participantMeta: participant?.meta ?? null,
        homeScore: row.home_score,
        awayScore: row.away_score,
        points: scoring.points,
        isExactHit: scoring.isExactHit,
        isOutcomeHit: scoring.isOutcomeHit
      };

      const normalizedParticipantQuery = normalizeText(participantQuery);
      const participantHaystack = normalizeText(
        [item.participantLabel, item.participantMeta].filter(Boolean).join(' ')
      );

      if (normalizedParticipantQuery && !participantHaystack.includes(normalizedParticipantQuery)) {
        continue;
      }

      const current = grouped.get(row.match_id) ?? [];
      current.push(item);
      grouped.set(row.match_id, current);
    }

    return filteredMatches
      .map((match) => ({
        match,
        predictions: [...(grouped.get(match.id) ?? [])].sort((a, b) =>
          a.participantLabel.localeCompare(b.participantLabel)
        )
      }))
      .filter((group) => group.predictions.length > 0);
  }, [filteredMatches, participantMap, participantQuery, predictionRows]);

  const summary = React.useMemo(() => {
    const participants = new Set(groupedAudits.flatMap((group) => group.predictions.map((item) => item.userId)));

    return {
      matches: groupedAudits.length,
      predictions: groupedAudits.reduce((acc, group) => acc + group.predictions.length, 0),
      participants: participants.size
    };
  }, [groupedAudits]);

  const activeFilterCount = countActiveFilters(filters, statusFilter, participantQuery);

  const badges: PageHeaderBadge[] = [
    {
      label: auditsVisible ? 'Auditorías activas' : 'Auditorías desactivadas',
      color: auditsVisible ? 'success' : 'warning',
      variant: auditsVisible ? 'filled' : 'outlined'
    },
    {
      label: `${summary.matches} partidos`,
      color: 'primary',
      variant: 'outlined'
    },
    {
      label: `${summary.predictions} pronósticos`,
      color: 'primary',
      variant: 'outlined'
    },
    {
      label: `${summary.participants} participantes`,
      color: 'default',
      variant: 'outlined'
    }
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Auditoría'
        description='Consulta los pronósticos visibles de todos los participantes'
        badges={badges}
      />

      {isError ? (
        <Alert severity='error'>
          {firstError instanceof Error ? firstError.message : 'No se pudo cargar la auditoría'}
        </Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : !auditsVisible ? (
        <Alert severity='info'>La auditoría está desactivada por configuración global.</Alert>
      ) : (
        <>
          <PageFiltersBar title='Filtrar auditoría' activeCount={activeFilterCount} collapsible>
            <Grid container spacing={1.5} sx={{ pt: 0.25 }}>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <TextField
                  select
                  label='Etapa'
                  fullWidth
                  size='small'
                  value={filters.stage}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      stage: event.target.value as MatchListFilters['stage']
                    }))
                  }
                >
                  <MenuItem value=''>Todas</MenuItem>
                  {stageOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 2.4 }}>
                <TextField
                  select
                  label='Grupo'
                  fullWidth
                  size='small'
                  value={filters.groupCode}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      groupCode: event.target.value
                    }))
                  }
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {groupOptions.map((groupCode) => (
                    <MenuItem key={groupCode} value={groupCode}>
                      Grupo {groupCode}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 2.4 }}>
                <TextField
                  select
                  label='Estado'
                  fullWidth
                  size='small'
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as AuditStatusFilter)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  <MenuItem value='scheduled'>Pendiente</MenuItem>
                  <MenuItem value='live'>En vivo</MenuItem>
                  <MenuItem value='finished'>Finalizado</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 2.4 }}>
                <TextField
                  label='Equipo'
                  fullWidth
                  size='small'
                  placeholder='Buscar por país o código'
                  value={filters.teamQuery}
                  onChange={(event) =>
                    setFilters((prev) => ({
                      ...prev,
                      teamQuery: event.target.value
                    }))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2.4 }}>
                <TextField
                  label='Participante'
                  fullWidth
                  size='small'
                  placeholder='Nombre o email'
                  value={participantQuery}
                  onChange={(event) => setParticipantQuery(event.target.value)}
                />
              </Grid>
            </Grid>
          </PageFiltersBar>

          {groupedAudits.length === 0 ? (
            <Alert severity='warning'>
              No se encontraron pronósticos visibles que coincidan con los filtros aplicados.
            </Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  xl: 'repeat(2, minmax(0, 1fr))'
                },
                gap: 2
              }}
            >
              {groupedAudits.map((group) => {
                const { match, predictions } = group;

                return (
                  <Card
                    key={match.id}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      height: '100%'
                    }}
                  >
                    <CardContent sx={{ p: 3, height: '100%' }}>
                      <Stack spacing={2}>
                        <Stack spacing={1}>
                          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                            <Chip label={match.group} size='small' variant='outlined' />
                            <Chip
                              label={getStatusLabel(match.status)}
                              size='small'
                              color={getStatusColor(match.status)}
                              variant='outlined'
                            />
                            <Chip label={`Oficial: ${getMatchScoreLabel(match)}`} size='small' color='primary' />
                            <Chip label={`${predictions.length} pronósticos`} size='small' />
                          </Stack>

                          <MatchVs match={match} />

                          <Typography variant='body2' color='text.secondary'>
                            {match.kickoff}
                          </Typography>

                          <Typography variant='body2' color='text.secondary'>
                            {match.stadium} · {match.city}
                          </Typography>
                        </Stack>

                        <Divider />

                        <Stack spacing={1.25}>
                          {predictions.map((item) => (
                            <Box
                              key={`${match.id}-${item.userId}`}
                              sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: 'background.paper'
                              }}
                            >
                              <Stack
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1.5}
                                justifyContent='space-between'
                                alignItems={{ xs: 'flex-start', md: 'center' }}
                              >
                                <Stack spacing={0.5}>
                                  <Typography fontWeight={800}>{item.participantLabel}</Typography>

                                  {item.participantMeta ? (
                                    <Typography variant='body2' color='text.secondary'>
                                      {item.participantMeta}
                                    </Typography>
                                  ) : null}
                                </Stack>

                                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                  <Chip label={`Pronóstico: ${item.homeScore} - ${item.awayScore}`} />
                                  {item.points === null ? (
                                    <Chip label='Sin evaluar' variant='outlined' />
                                  ) : (
                                    <Chip
                                      label={`${item.points} pts`}
                                      color={item.points > 0 ? 'success' : 'default'}
                                      variant={item.points > 0 ? 'filled' : 'outlined'}
                                    />
                                  )}

                                  {item.isExactHit ? <Chip label='Exacto' color='success' variant='outlined' /> : null}

                                  {!item.isExactHit && item.isOutcomeHit ? (
                                    <Chip label='Acierto de signo' color='primary' variant='outlined' />
                                  ) : null}
                                </Stack>
                              </Stack>
                            </Box>
                          ))}
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
