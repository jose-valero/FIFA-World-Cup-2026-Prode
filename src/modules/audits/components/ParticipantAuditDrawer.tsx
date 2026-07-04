import * as React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { useMatches } from '../../matches/hooks/useMatches';
import { MatchVs } from '../../../shared/components/MatchVs';
import { getStatusColor } from '../../../shared/utils/getStatusColor';
import { getStatusLabel } from '../../../shared/utils/getStatusLabel';
import { getUniqueGroupOptions, getUniqueStageOptions, type StageFilterValue } from '../../matches/utils/listFilters';
import type { Match, MatchStatus } from '../../matches/types/types';
import { useAuditPredictionsByUser } from '../hooks/useAuditPredictionsByUser';
import type { LeaderboardRow } from '../../leaderboard/types/leaderboard.types';

type StatusFilterValue = MatchStatus | '';

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'live', label: getStatusLabel('live') },
  { value: 'scheduled', label: getStatusLabel('scheduled') },
  { value: 'finished', label: getStatusLabel('finished') }
];

const STATUS_ORDER: Record<MatchStatus, number> = { live: 0, scheduled: 1, finished: 2 };

type ParticipantAuditDrawerProps = {
  open: boolean;
  onClose: () => void;
  participant: LeaderboardRow | null;
  auditsVisible: boolean;
  currentUserId: string | null;
};

type PredictionItem = {
  match: Match | null;
  homeScore: number;
  awayScore: number;
  knockoutTiebreak: string | null;
  knockoutWinner: string | null;
  points: number | null;
  isExactHit: boolean;
  isOutcomeHit: boolean;
  knockoutBonus: number;
};

function getPredictionOutcome(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function getKnockoutBonus(
  prediction: { homeScore: number; awayScore: number; knockoutTiebreak: string | null; knockoutWinner: string | null },
  match: Match
): number {
  if (match.stage === 'group_stage') return 0;
  if (prediction.homeScore !== prediction.awayScore) return 0;
  if (!prediction.knockoutTiebreak || !prediction.knockoutWinner) return 0;
  if (match.officialHomeScore === null || match.officialAwayScore === null) return 0;
  if (match.officialHomeScore !== match.officialAwayScore) return 0;
  if (match.penaltyHomeScore === null || match.penaltyAwayScore === null) return 0;
  if (prediction.knockoutTiebreak !== 'penalties') return 0;

  const officialWinner = match.penaltyHomeScore > match.penaltyAwayScore ? 'home' : 'away';
  return 2 + (prediction.knockoutWinner === officialWinner ? 1 : 0);
}

function getPredictionPoints(
  prediction: { homeScore: number; awayScore: number; knockoutTiebreak: string | null; knockoutWinner: string | null },
  match: Match | null
) {
  if (!match || match.officialHomeScore === null || match.officialAwayScore === null) {
    return {
      points: null,
      isExactHit: false,
      isOutcomeHit: false,
      knockoutBonus: 0
    };
  }

  const isExactHit =
    prediction.homeScore === match.officialHomeScore && prediction.awayScore === match.officialAwayScore;

  const predictionOutcome = getPredictionOutcome(prediction.homeScore, prediction.awayScore);
  const officialOutcome = getPredictionOutcome(match.officialHomeScore, match.officialAwayScore);
  const isOutcomeHit = predictionOutcome === officialOutcome;

  const basePoints = isExactHit ? 5 : isOutcomeHit ? 3 : 0;
  const knockoutBonus = getKnockoutBonus(prediction, match);

  return {
    points: basePoints + knockoutBonus,
    isExactHit,
    isOutcomeHit,
    knockoutBonus
  };
}

function sortAuditItems(items: PredictionItem[]): PredictionItem[] {
  return [...items].sort((a, b) => {
    const aOrder = a.match ? STATUS_ORDER[a.match.status] : 1;
    const bOrder = b.match ? STATUS_ORDER[b.match.status] : 1;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const aTime = a.match ? new Date(a.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.match ? new Date(b.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export function ParticipantAuditDrawer({ open, onClose, participant, auditsVisible, currentUserId }: ParticipantAuditDrawerProps) {
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [stageFilter, setStageFilter] = React.useState<StageFilterValue>('');
  const [groupFilter, setGroupFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterValue>('');

  React.useEffect(() => {
    if (!open) return;
    setStageFilter('');
    setGroupFilter('');
    setStatusFilter('');
  }, [open, participant?.user_id]);

  React.useEffect(() => {
    if (stageFilter !== 'group_stage') {
      setGroupFilter('');
    }
  }, [stageFilter]);

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  // Always enable the query for the current user's own predictions (own predictions
  // are always readable per RLS regardless of audits_visible). For other participants,
  // require auditsVisible so the admin controls when audit data is exposed.
  const isOwnUser = Boolean(currentUserId && participant?.user_id === currentUserId);
  const predictionsEnabled = open && (isOwnUser || auditsVisible);

  const {
    data: predictionRows = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError,
    error: predictionsError
  } = useAuditPredictionsByUser(participant?.user_id, predictionsEnabled);

  const isLoading = open && (isMatchesLoading || isPredictionsLoading);
  const isError = isMatchesError || isPredictionsError;
  const firstError = matchesError || predictionsError;

  const matchMap = React.useMemo(() => {
    return new Map(matches.map((match) => [match.id, match]));
  }, [matches]);

  const predictionItems = React.useMemo(() => {
    const items = predictionRows.map((row) => {
      const match = matchMap.get(row.match_id) ?? null;
      const predInput = {
        homeScore: row.home_score,
        awayScore: row.away_score,
        knockoutTiebreak: row.knockout_tiebreak ?? null,
        knockoutWinner: row.knockout_winner ?? null
      };
      const scoring = getPredictionPoints(predInput, match);

      return {
        match,
        homeScore: row.home_score,
        awayScore: row.away_score,
        knockoutTiebreak: row.knockout_tiebreak ?? null,
        knockoutWinner: row.knockout_winner ?? null,
        points: scoring.points,
        isExactHit: scoring.isExactHit,
        isOutcomeHit: scoring.isOutcomeHit,
        knockoutBonus: scoring.knockoutBonus
      };
    });

    return sortAuditItems(items);
  }, [predictionRows, matchMap]);

  const validMatches = React.useMemo(() => {
    return predictionItems.map((item) => item.match).filter(Boolean) as Match[];
  }, [predictionItems]);

  const stageOptions = React.useMemo(() => getUniqueStageOptions(validMatches), [validMatches]);

  const groupOptions = React.useMemo(() => {
    if (stageFilter !== 'group_stage') return [];
    return getUniqueGroupOptions(validMatches.filter((match) => match.stage === 'group_stage'));
  }, [validMatches, stageFilter]);

  const filteredItems = React.useMemo(() => {
    return predictionItems.filter((item) => {
      if (!item.match) return false;

      const matchesStage = !stageFilter || item.match.stage === stageFilter;
      const matchesGroup = stageFilter !== 'group_stage' || !groupFilter || item.match.groupCode === groupFilter;
      const matchesStatus = !statusFilter || item.match.status === statusFilter;

      return matchesStage && matchesGroup && matchesStatus;
    });
  }, [predictionItems, stageFilter, groupFilter, statusFilter]);

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 720 }
        }
      }}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={2}>
          <Stack spacing={1}>
            <Typography variant='h5' fontWeight={800}>
              {participant?.display_name ?? 'Participante'}
            </Typography>
          </Stack>

          <IconButton onClick={onClose} aria-label='Cerrar detalle de pronósticos'>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {!predictionsEnabled ? (
          <Alert severity='info'>La auditoría no está disponible en este momento.</Alert>
        ) : isError ? (
          <Alert severity='error'>
            {firstError instanceof Error ? firstError.message : 'No se pudieron cargar los pronósticos'}
          </Alert>
        ) : isLoading ? (
          <Stack alignItems='center' justifyContent='center' sx={{ flex: 1 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ minHeight: 0, flex: 1 }}>
            <Stack spacing={1.5}>
              <Typography variant='subtitle2' color='text.secondary'>
                Filtrar pronósticos
              </Typography>

              <Box sx={{ overflowX: 'auto', pb: 0.25 }}>
                <ToggleButtonGroup
                  exclusive
                  value={stageFilter}
                  onChange={(_, value: StageFilterValue | null) => {
                    setStageFilter(value ?? '');
                  }}
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  <ToggleButton value='' sx={{ borderRadius: 999 }}>
                    Todos
                  </ToggleButton>

                  {stageOptions.map((option) => (
                    <ToggleButton key={option.value} value={option.value} sx={{ borderRadius: 999 }}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {stageFilter === 'group_stage' && groupOptions.length > 0 ? (
                <Box sx={{ overflowX: 'auto', pb: 0.25 }}>
                  <ToggleButtonGroup
                    exclusive
                    value={groupFilter}
                    onChange={(_, value: string | null) => {
                      setGroupFilter(value ?? '');
                    }}
                    sx={{ flexWrap: 'wrap', gap: 1 }}
                  >
                    <ToggleButton value='' sx={{ borderRadius: 999 }}>
                      Todos los grupos
                    </ToggleButton>

                    {groupOptions.map((groupCode) => (
                      <ToggleButton key={groupCode} value={groupCode} sx={{ borderRadius: 999 }}>
                        Grupo {groupCode}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Box>
              ) : null}

              <Box sx={{ overflowX: 'auto', pb: 0.25 }}>
                <ToggleButtonGroup
                  exclusive
                  value={statusFilter}
                  onChange={(_, value: StatusFilterValue | null) => {
                    setStatusFilter(value ?? '');
                  }}
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <ToggleButton key={option.value} value={option.value} sx={{ borderRadius: 999 }}>
                      {option.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Stack>

            <Divider />

            {filteredItems.length === 0 ? (
              <Alert severity='info'>No hay pronósticos para el alcance seleccionado.</Alert>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
                <Stack spacing={2}>
                  {filteredItems.map((item, index) => {
                    const match = item.match;

                    if (!match) return null;

                    return (
                      <Card
                        key={`${match.id}-${index}`}
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Stack spacing={2}>
                            <Stack
                              direction={{ xs: 'column', md: 'row' }}
                              spacing={2}
                              justifyContent='space-between'
                              alignItems={{ xs: 'flex-start', md: 'center' }}
                            >
                              <Stack spacing={0.75}>
                                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                  <Chip label={match.group} size='small' variant='outlined' />
                                  <Chip
                                    label={getStatusLabel(match.status)}
                                    size='small'
                                    color={getStatusColor(match.status)}
                                    variant='outlined'
                                  />
                                </Stack>

                                <MatchVs match={match} />

                                <Typography variant='body2' color='text.secondary'>
                                  {match.kickoff}
                                </Typography>

                                <Typography variant='body2' color='text.secondary'>
                                  {match.stadium} · {match.city}
                                </Typography>
                              </Stack>

                              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                                {item.points === null ? (
                                  <Chip label='Sin evaluar' color='default' />
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

                            <Divider />

                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant='body2' color='text.secondary'>
                                  Su pronóstico
                                </Typography>
                                <Typography fontWeight={800}>
                                  {item.homeScore} - {item.awayScore}
                                </Typography>
                                {item.knockoutTiebreak ? (
                                  <Typography variant='caption' color='text.secondary'>
                                    {item.knockoutTiebreak === 'penalties' ? 'Penales' : 'Prórroga'} ·{' '}
                                    {item.knockoutWinner === 'home' ? match.homeTeam : match.awayTeam}
                                  </Typography>
                                ) : null}
                              </Box>

                              <Box sx={{ flex: 1 }}>
                                <Typography variant='body2' color='text.secondary'>
                                  Resultado oficial
                                </Typography>
                                <Typography fontWeight={800}>
                                  {match.officialHomeScore !== null && match.officialAwayScore !== null
                                    ? `${match.officialHomeScore} - ${match.officialAwayScore}`
                                    : 'Pendiente'}
                                </Typography>
                                {match.penaltyHomeScore !== null && match.penaltyAwayScore !== null ? (
                                  <Typography variant='caption' color='text.secondary'>
                                    PEN {match.penaltyHomeScore} - {match.penaltyAwayScore}
                                  </Typography>
                                ) : null}
                              </Box>
                            </Stack>

                            {item.knockoutBonus > 0 ? (
                              <Chip
                                label={`+${item.knockoutBonus} pts bonus eliminatoria`}
                                size='small'
                                color='secondary'
                                variant='outlined'
                                sx={{ alignSelf: 'flex-start' }}
                              />
                            ) : null}
                          </Stack>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
