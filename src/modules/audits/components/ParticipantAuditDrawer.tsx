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
import type { Match } from '../../matches/types/types';
import { useAuditPredictionsByUser } from '../hooks/useAuditPredictionsByUser';
import type { LeaderboardRow } from '../../leaderboard/types/leaderboard.types';

type ParticipantAuditDrawerProps = {
  open: boolean;
  onClose: () => void;
  participant: LeaderboardRow | null;
  auditsVisible: boolean;
};

type PredictionItem = {
  match: Match | null;
  homeScore: number;
  awayScore: number;
  points: number | null;
  isExactHit: boolean;
  isOutcomeHit: boolean;
};

function getPredictionOutcome(homeScore: number, awayScore: number) {
  if (homeScore > awayScore) return 'home';
  if (homeScore < awayScore) return 'away';
  return 'draw';
}

function getPredictionPoints(prediction: { homeScore: number; awayScore: number }, match: Match | null) {
  if (!match || match.officialHomeScore === null || match.officialAwayScore === null) {
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

  return {
    points: predictionOutcome === officialOutcome ? 3 : 0,
    isExactHit: false,
    isOutcomeHit: predictionOutcome === officialOutcome
  };
}

function sortByKickoff(items: PredictionItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.match ? new Date(a.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.match ? new Date(b.match.kickoffAt).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export function ParticipantAuditDrawer({ open, onClose, participant, auditsVisible }: ParticipantAuditDrawerProps) {
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [stageFilter, setStageFilter] = React.useState<StageFilterValue>('');
  const [groupFilter, setGroupFilter] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setStageFilter('');
    setGroupFilter('');
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

  const {
    data: predictionRows = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError,
    error: predictionsError
  } = useAuditPredictionsByUser(participant?.user_id, open && auditsVisible);

  const isLoading = open && (isMatchesLoading || isPredictionsLoading);
  const isError = isMatchesError || isPredictionsError;
  const firstError = matchesError || predictionsError;

  const matchMap = React.useMemo(() => {
    return new Map(matches.map((match) => [match.id, match]));
  }, [matches]);

  const predictionItems = React.useMemo(() => {
    const items = predictionRows.map((row) => {
      const match = matchMap.get(row.match_id) ?? null;
      const scoring = getPredictionPoints(
        {
          homeScore: row.home_score,
          awayScore: row.away_score
        },
        match
      );

      return {
        match,
        homeScore: row.home_score,
        awayScore: row.away_score,
        points: scoring.points,
        isExactHit: scoring.isExactHit,
        isOutcomeHit: scoring.isOutcomeHit
      };
    });

    return sortByKickoff(items);
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

      return matchesStage && matchesGroup;
    });
  }, [predictionItems, stageFilter, groupFilter]);

  const scopeSummary = React.useMemo(() => {
    const exactHits = filteredItems.filter((item) => item.isExactHit).length;
    const outcomeHits = filteredItems.filter((item) => item.isOutcomeHit).length;
    const evaluated = filteredItems.filter((item) => item.points !== null).length;
    const totalPoints = filteredItems.reduce((acc, item) => acc + (item.points ?? 0), 0);

    return {
      loaded: filteredItems.length,
      evaluated,
      exactHits,
      outcomeHits,
      totalPoints
    };
  }, [filteredItems]);

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

            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
              {participant ? <Chip label={`${participant.total_points} pts`} color='primary' /> : null}
              {participant ? <Chip label={`${participant.exact_hits} exactos`} variant='outlined' /> : null}
              {participant ? <Chip label={`${participant.outcome_hits} signo`} variant='outlined' /> : null}
              {participant ? <Chip label={`${participant.scored_predictions} evaluados`} variant='outlined' /> : null}
            </Stack>
          </Stack>

          <IconButton onClick={onClose} aria-label='Cerrar detalle de pronósticos'>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {!auditsVisible ? (
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

              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={`${scopeSummary.loaded} cargados`} variant='outlined' />
                <Chip label={`${scopeSummary.evaluated} evaluados`} variant='outlined' />
                <Chip label={`${scopeSummary.totalPoints} pts`} color='primary' variant='outlined' />
                <Chip label={`${scopeSummary.exactHits} exactos`} variant='outlined' />
              </Stack>
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
                              </Box>
                            </Stack>
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
