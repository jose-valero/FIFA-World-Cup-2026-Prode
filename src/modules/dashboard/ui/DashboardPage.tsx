import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMatches } from '../../matches/hooks/useMatches';
import { usePredictionsByUser } from '../../predictions/hooks/usePredictionsByUser';
import { useLeaderboard } from '../../leaderboard/hooks/useLeaderboard';
import { useAppSettings } from '../../admin/settings/hooks/useAppSettings';
import { getTournamentPhase } from '../utils/getTournamentPhase';
import { sortMatchesByKickoff } from '../utils/sortMatchesByKickoff';
import { isPredictionsClosed } from '../../../shared/utils/isPredictionsClosed';
import { routes, matchDetailPath } from '../../../app/router/routes';
import { TodayMatchesScroller } from '../components/TodayMatchesScroller';
import { buildLeaderboardRanks } from '../../leaderboard/utils/buildLeaderboardRanks';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
// Columna compacta reutilizable para las 2 filas del bloque unificado.
// large=true → fila superior (posición/puntos/líder); large=false → fila inferior (exactos/aciertos/efectividad)
function StatColumn({
  label,
  value,
  subtext,
  valueColor,
  large = false
}: {
  label: string;
  value: string;
  subtext?: string;
  valueColor?: string;
  large?: boolean;
}) {
  return (
    <Stack
      alignItems='center'
      spacing={0.25}
      sx={{ flex: 1, px: { xs: 0.75, sm: 1.5 }, py: { xs: 1, sm: 1.25 }, textAlign: 'center' }}
    >
      <Typography
        sx={{
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: 'text.secondary'
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: large ? { xs: '1.625rem', sm: '1.875rem' } : { xs: '1.375rem', sm: '1.625rem' },
          fontWeight: large ? 800 : 700,
          lineHeight: 1.1,
          color: valueColor ?? 'text.primary'
        }}
      >
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', color: subtext ? 'text.disabled' : 'transparent', lineHeight: 1 }}>
        {subtext ?? 'x'}
      </Typography>
    </Stack>
  );
}

function TournamentProgressRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <Stack spacing={0.5}>
      <Stack direction='row' justifyContent='space-between' alignItems='baseline' spacing={1}>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', flexShrink: 0 }}>
          {value}
        </Typography>
      </Stack>
      <LinearProgress
        variant='determinate'
        value={Math.max(0, Math.min(progress, 100))}
        sx={{ height: 6, borderRadius: 999 }}
      />
    </Stack>
  );
}

// efectividad = puntos obtenidos / máximo posible (5 pts × partidos evaluados)
// Math.min(100) como salvaguarda ante inconsistencias en los contadores del backend
function calculateEffectiveness(points: number, scoredCount: number): number | null {
  if (scoredCount <= 0) return null;
  return Math.min(100, Math.round((points / (scoredCount * 5)) * 100));
}

// Sports day boundary: 06:00 local. Matches between 00:00–05:59 belong to the previous day's matchday.
function getSportsDayKey(date: Date): string {
  const adjusted = new Date(date.getTime() - 6 * 60 * 60 * 1000);
  return adjusted.toDateString();
}

type StreakResult = 'exact' | 'sign' | 'miss';

function scoreResult(pH: number, pA: number, oH: number, oA: number): StreakResult {
  if (pH === oH && pA === oA) return 'exact';
  const predSign = pH > pA ? 1 : pH < pA ? -1 : 0;
  const officialSign = oH > oA ? 1 : oH < oA ? -1 : 0;
  return predSign === officialSign ? 'sign' : 'miss';
}

export function DashboardPage() {
  const { user, profile } = useAuth();

  const {
    data: matches = [],
    isLoading: isMatchesLoading,
    isError: isMatchesError,
    error: matchesError
  } = useMatches();

  const {
    data: predictions = [],
    isLoading: isPredictionsLoading,
    isError: isPredictionsError,
    error: predictionsError
  } = usePredictionsByUser(user?.id!);

  const {
    data: leaderboard = [],
    isLoading: isLeaderboardLoading,
    isError: isLeaderboardError,
    error: leaderboardError
  } = useLeaderboard();

  const {
    data: settings = null,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
    error: settingsError
  } = useAppSettings();

  const isLoading = isMatchesLoading || isPredictionsLoading || isLeaderboardLoading || isSettingsLoading;
  const isError = isMatchesError || isPredictionsError || isLeaderboardError || isSettingsError;
  const firstError = matchesError || predictionsError || leaderboardError || settingsError;

  const sortedMatches = React.useMemo(() => sortMatchesByKickoff(matches), [matches]);

  const todayMatches = React.useMemo(() => {
    const todayKey = getSportsDayKey(new Date());
    return sortedMatches.filter((m) => m.status === 'live' || getSportsDayKey(new Date(m.kickoffAt)) === todayKey);
  }, [sortedMatches]);

  const currentUserRow = React.useMemo(() => {
    if (!user?.id) return null;
    return leaderboard.find((row) => row.user_id === user.id) ?? null;
  }, [leaderboard, user?.id]);

  const leaderRow = leaderboard.filter((r) => !r.is_disabled)[0] ?? null;
  const leaderPoints = leaderRow?.total_points ?? 0;
  const myPoints = currentUserRow?.total_points ?? 0;
  const distanceToLeader = Math.max(leaderPoints - myPoints, 0);

  const globalPosition = React.useMemo(() => {
    if (!user?.id) return null;
    const activeLeaderboard = leaderboard.filter((row) => !row.is_disabled);
    return buildLeaderboardRanks(activeLeaderboard).get(user.id) ?? null;
  }, [leaderboard, user?.id]);

  const predictionsClosed = isPredictionsClosed(
    settings?.predictions_open ?? true,
    settings?.predictions_close_at ?? null
  );

  const totalMatches = matches.length;
  const loadedPredictions = predictions.length;
  const exactHits = currentUserRow?.exact_hits ?? 0;
  const outcomeHits = currentUserRow?.outcome_hits ?? 0;
  const scoredPredictions = currentUserRow?.scored_predictions ?? 0;

  const efectividad = calculateEffectiveness(myPoints, scoredPredictions);

  const predictionLoadProgress = totalMatches > 0 ? (loadedPredictions / totalMatches) * 100 : 0;

  const tournamentPhase = getTournamentPhase(matches);

  const predictionByMatchId = React.useMemo(() => new Map(predictions.map((p) => [p.match_id, p])), [predictions]);

  const lastFiveStreak = React.useMemo((): StreakResult[] => {
    const items: StreakResult[] = [];
    for (const match of sortedMatches) {
      if (match.status !== 'finished') continue;
      if (match.officialHomeScore === null || match.officialAwayScore === null) continue;
      const pred = predictionByMatchId.get(match.id);
      if (!pred) continue;
      items.push(scoreResult(pred.home_score, pred.away_score, match.officialHomeScore, match.officialAwayScore));
    }
    return items.slice(-5);
  }, [sortedMatches, predictionByMatchId]);

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return (
      <Alert severity='error'>
        {firstError instanceof Error ? firstError.message : 'No se pudo cargar el panel de control'}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {/* 1. Partidos de hoy */}
      {todayMatches.length > 0 ? (
        <Box>
          <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
            Partidos de hoy
          </Typography>
          <TodayMatchesScroller matches={todayMatches} />
        </Box>
      ) : null}

      {/* 2. Resumen unificado: 2 filas × 3 columnas */}
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {/* Fila 1: posición, puntos, distancia al líder */}
          <Stack direction='row' divider={<Divider orientation='vertical' flexItem />}>
            <StatColumn label='Posición' value={globalPosition ? `#${globalPosition}` : '–'} large />
            <StatColumn label='Puntos' value={String(myPoints)} subtext='pts' large />
            <StatColumn
              label='Del líder'
              value={distanceToLeader === 0 ? 'Líder' : `-${distanceToLeader}`}
              subtext={distanceToLeader > 0 ? 'pts' : undefined}
              valueColor={distanceToLeader === 0 ? 'success.main' : undefined}
              large
            />
          </Stack>

          <Divider />

          {/* Fila 2: exactos, aciertos de signo, efectividad */}
          <Stack direction='row' divider={<Divider orientation='vertical' flexItem />}>
            <StatColumn label='Exactos' value={String(exactHits)} />
            <StatColumn label='Aciertos' value={String(outcomeHits)} />
            <StatColumn label='Efectividad' value={efectividad !== null ? `${efectividad}%` : '–'} />
          </Stack>
        </CardContent>
      </Card>

      {/* 3. Estado del torneo */}
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Stack spacing={1.5}>
            {/* <Typography variant='subtitle1' fontWeight={800}>
              Estado del torneo
            </Typography> */}

            {/* Fase izquierda · Pronósticos derecha */}
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
              <Stack spacing={0.25}>
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 600, color: 'text.primary' }}>
                  {tournamentPhase}
                </Typography>
              </Stack>

              <Stack direction='row' alignItems='flex-end' spacing={1}>
                <Typography
                  sx={{
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Pronósticos:
                </Typography>
                <Stack direction='row' alignItems='center' spacing={0.5}>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      fontWeight: 700,
                      color: predictionsClosed ? 'text.secondary' : 'success.main'
                    }}
                  >
                    {predictionsClosed ? 'Cerrados' : 'Abiertos'}
                  </Typography>
                  {predictionsClosed ? (
                    <BlockIcon sx={{ fontSize: '13px' }} color={'disabled'} />
                  ) : (
                    <CheckCircleIcon sx={{ fontSize: '13px' }} color={'success'} />
                  )}
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <TournamentProgressRow
              label='Pronósticos cargados'
              value={`${loadedPredictions} / ${totalMatches}`}
              progress={predictionLoadProgress}
            />
          </Stack>
        </CardContent>
      </Card>

      {/* 4. Pronósticos de hoy + Racha actual */}
      {todayMatches.length > 0 || lastFiveStreak.length > 0 ? (
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {/* Pronósticos de hoy */}
            {todayMatches.length > 0 ? (
              <Stack>
                <Box sx={{ px: { xs: 1.5, sm: 2 }, pt: { xs: 1.5, sm: 2 }, pb: 1 }}>
                  <Typography variant='subtitle1' fontWeight={800}>
                    Pronósticos de hoy
                  </Typography>
                </Box>

                {todayMatches.map((match) => {
                  const pred = predictionByMatchId.get(match.id);
                  const isLive = match.status === 'live';
                  const timeLabel = isLive
                    ? 'En vivo'
                    : new Date(match.kickoffAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <React.Fragment key={match.id}>
                      <Divider />
                      <Box
                        component={RouterLink}
                        to={matchDetailPath(match.id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: { xs: 1.5, sm: 2 },
                          py: 1.25,
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': { bgcolor: 'action.hover' },
                          gap: 1
                        }}
                      >
                        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {match.homeTeam} vs {match.awayTeam}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: isLive ? 700 : 400,
                              color: isLive ? 'error.main' : 'text.secondary'
                            }}
                          >
                            {timeLabel}
                          </Typography>
                        </Stack>

                        {pred ? (
                          <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 800, flexShrink: 0 }}>
                            {pred.home_score} – {pred.away_score}
                          </Typography>
                        ) : (
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', flexShrink: 0 }}>
                            Sin pronóstico
                          </Typography>
                        )}
                      </Box>
                    </React.Fragment>
                  );
                })}
              </Stack>
            ) : null}

            {/* Racha actual */}
            {lastFiveStreak.length > 0 ? (
              <>
                <Divider />
                <Box sx={{ px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 2 } }}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'text.secondary'
                      }}
                    >
                      Racha actual
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {lastFiveStreak.filter((r) => r !== 'miss').length} de {lastFiveStreak.length} acertados
                    </Typography>
                  </Stack>

                  <Stack direction='row' spacing={0.75}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const result = lastFiveStreak[i] ?? null;
                      const bgcolor =
                        result === 'exact'
                          ? 'secondary.dark'
                          : result === 'sign'
                            ? 'primary.main'
                            : result === 'miss'
                              ? 'error.main'
                              : 'action.disabledBackground';
                      return (
                        <Box
                          key={i}
                          sx={{
                            flex: 1,
                            height: 26,
                            borderRadius: 1,
                            bgcolor,
                            opacity: result === null ? 0.35 : 1
                          }}
                        />
                      );
                    })}
                  </Stack>

                  <Stack direction='row' spacing={2} sx={{ mt: 0.75 }} flexWrap='wrap' useFlexGap>
                    {(
                      [
                        { key: 'exact', label: 'Exacto', color: 'secondary.dark' },
                        { key: 'sign', label: 'Acierto', color: 'primary.main' },
                        { key: 'miss', label: 'Fallo', color: 'error.main' }
                      ] as const
                    ).map(({ key, label, color }) => (
                      <Stack key={key} direction='row' spacing={0.5} alignItems='center'>
                        <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: color }} />
                        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{label}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* 5. Admin */}
      {profile?.is_admin ? (
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack spacing={1.5}>
              <Typography variant='subtitle2' fontWeight={800} color='text.secondary'>
                Administración
              </Typography>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Button component={RouterLink} to={routes.adminMatches} size='small' variant='outlined'>
                  Partidos
                </Button>
                <Button component={RouterLink} to={routes.adminResults} size='small' variant='outlined'>
                  Resultados
                </Button>
                <Button component={RouterLink} to={routes.adminSettings} size='small' variant='outlined'>
                  Ajustes
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ) : null}
    </Stack>
  );
}
