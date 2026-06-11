import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StadiumIcon from '@mui/icons-material/Stadium';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useMatches } from '../hooks/useMatches';
import { useMatchDetail } from '../hooks/useMatchDetail';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { getStageLabel } from '../../tournament/utils/stages';
import { routes } from '../../../app/router/routes';
import type { Match } from '../types/types';
import type { MatchDetailPayload, MatchDetailEvent } from '../types/matchDetail.types';

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function fmtTime(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, minuteLabel }: { status: string; minuteLabel: string | null }) {
  const isLive = status === 'live';
  const isFinished = status === 'finished';

  const label = isLive
    ? minuteLabel
      ? `EN VIVO · ${minuteLabel}`
      : 'EN VIVO'
    : isFinished
      ? 'Finalizado'
      : 'Pendiente';

  const sx = isLive
    ? {
        border: '1px solid',
        borderColor: 'success.main',
        bgcolor: 'rgba(57,217,138,0.10)',
        color: 'success.main'
      }
    : isFinished
      ? {
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(255,255,255,0.04)',
          color: 'text.secondary'
        }
      : {
          border: '1px solid',
          borderColor: 'warning.main',
          bgcolor: 'rgba(255,181,71,0.10)',
          color: 'warning.main'
        };

  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        borderRadius: '999px',
        whiteSpace: 'nowrap',
        ...sx
      }}
    >
      {isLive && (
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'success.main',
            animation: 'pulse 1.4s ease-in-out infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.3 }
            }
          }}
        />
      )}
      <Typography component='span' sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.4, color: 'inherit' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ── Scorer list ───────────────────────────────────────────────────────────────

function scorerLabel(e: MatchDetailEvent): string {
  const suffix = e.type === 'penalty_goal' ? ' (P)' : e.type === 'own_goal' ? ' (OG)' : '';
  return `${e.player}${suffix} ${e.minute}`;
}

function ScorerList({ events }: { events: MatchDetailEvent[] }) {
  const home = events.filter((e) => e.side === 'home');
  const away = events.filter((e) => e.side === 'away');

  const col = (list: MatchDetailEvent[], align: 'left' | 'right') => (
    <Stack spacing={0.4} alignItems={align === 'right' ? 'flex-end' : 'flex-start'} sx={{ flex: 1 }}>
      {list.map((e, i) => (
        <Stack key={i} direction='row' spacing={0.5} alignItems='center'>
          {align === 'left' && <Typography sx={{ fontSize: '0.75rem' }}>⚽</Typography>}
          <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.5, fontWeight: 500 }}>
            {scorerLabel(e)}
          </Typography>
          {align === 'right' && <Typography sx={{ fontSize: '0.75rem' }}>⚽</Typography>}
        </Stack>
      ))}
    </Stack>
  );

  if (home.length === 0 && away.length === 0) return null;

  return (
    <Stack direction='row' sx={{ width: '100%', px: { xs: 1, md: 2 } }}>
      {col(home, 'right')}
      <Box sx={{ width: { xs: 48, md: 64 }, flexShrink: 0 }} />
      {col(away, 'left')}
    </Stack>
  );
}

// ── HeroData abstraction (preserves fallback logic) ───────────────────────────

type HeroData = {
  status: string;
  minuteLabel: string | null;
  homeCode: string;
  awayCode: string;
  homeName: string;
  awayName: string;
  scoreHome: number | null;
  scoreAway: number | null;
  events: MatchDetailEvent[];
  kickoffAt: string;
  venueName: string;
  venueCity: string;
  stage: string;
  groupCode: string | null;
  displayOrder: number | null;
  espnEnriched: boolean;
};

function heroFromDetail(d: MatchDetailPayload, m: Match): HeroData {
  return {
    status: d.status,
    minuteLabel: d.minuteLabel,
    homeCode: d.homeTeam.code,
    awayCode: d.awayTeam.code,
    homeName: d.homeTeam.name,
    awayName: d.awayTeam.name,
    scoreHome: d.score?.home ?? null,
    scoreAway: d.score?.away ?? null,
    events: d.events,
    kickoffAt: d.kickoffAt,
    venueName: d.venueName,
    venueCity: d.venueCity,
    stage: d.stage,
    groupCode: d.groupCode,
    displayOrder: m.displayOrder,
    espnEnriched: d.espnEnriched
  };
}

function heroFromMatch(m: Match): HeroData {
  return {
    status: m.status,
    minuteLabel: null,
    homeCode: m.homeTeamCode ?? '',
    awayCode: m.awayTeamCode ?? '',
    homeName: m.homeTeam,
    awayName: m.awayTeam,
    scoreHome: m.officialHomeScore,
    scoreAway: m.officialAwayScore,
    events: [],
    kickoffAt: m.kickoffAt,
    venueName: m.stadium,
    venueCity: m.city,
    stage: m.stage,
    groupCode: m.groupCode,
    displayOrder: m.displayOrder,
    espnEnriched: false
  };
}

// ── Metadata strip ────────────────────────────────────────────────────────────

function MetaBlock({ icon, primary, secondary }: { icon: React.ReactNode; primary: string; secondary?: string }) {
  return (
    <Stack alignItems='center' spacing={0.5} sx={{ flex: 1, minWidth: 0, px: 1 }}>
      <Box sx={{ color: 'text.disabled', display: 'flex' }}>{icon}</Box>
      <Typography
        variant='caption'
        fontWeight={700}
        textAlign='center'
        noWrap
        sx={{ width: '100%', color: 'text.primary' }}
      >
        {primary}
      </Typography>
      {secondary && (
        <Typography variant='caption' textAlign='center' noWrap sx={{ width: '100%', color: 'text.secondary' }}>
          {secondary}
        </Typography>
      )}
    </Stack>
  );
}

function MetaDivider() {
  return <Divider orientation='vertical' flexItem sx={{ borderColor: 'divider', alignSelf: 'stretch', my: 0.5 }} />;
}

// ── MatchHero ─────────────────────────────────────────────────────────────────

function MatchHero({ match, detail }: { match: Match; detail: MatchDetailPayload | null }) {
  const navigate = useNavigate();

  function handleBack() {
    const canGoBack = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (canGoBack > 0) navigate(-1);
    else navigate(routes.fixture);
  }

  const h = detail ? heroFromDetail(detail, match) : heroFromMatch(match);
  const isLive = h.status === 'live';
  const isFinished = h.status === 'finished';
  const hasScore = h.scoreHome != null && h.scoreAway != null;

  const stageLabel = getStageLabel(h.stage as Parameters<typeof getStageLabel>[0]);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: isLive ? 'success.main' : 'divider',
        overflow: 'hidden'
      }}
    >
      {/* Live accent bar */}
      {isLive && <Box sx={{ height: 3, bgcolor: 'success.main' }} />}

      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack spacing={0}>
          {/* ── Row 1: back + breadcrumb + status badge ── */}
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2.5 }}>
            <Stack direction='row' spacing={1} alignItems='center' sx={{ minWidth: 0 }}>
              <IconButton onClick={handleBack} size='small' aria-label='Volver atrás' sx={{ flexShrink: 0 }}>
                <ArrowBackIcon fontSize='small' />
              </IconButton>
              <Typography
                variant='caption'
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {stageLabel}
                {h.groupCode ? ` · Grupo ${h.groupCode}` : ''}
              </Typography>
            </Stack>

            <Box sx={{ flexShrink: 0, ml: 1 }}>
              <StatusBadge status={h.status} minuteLabel={h.minuteLabel} />
            </Box>
          </Stack>

          {/* ── Row 2: teams + score ── */}
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='center'
            spacing={{ xs: 1.5, sm: 3, md: 4 }}
            sx={{ py: { xs: 1.5, md: 2.5 } }}
          >
            {/* Home team */}
            <Stack alignItems='center' spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <TeamFlag teamCode={h.homeCode} teamName={h.homeName} size={52} />
              <Typography
                fontWeight={800}
                textAlign='center'
                sx={{
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' },
                  lineHeight: 1.25,
                  maxWidth: { xs: 90, sm: 130 }
                }}
              >
                {h.homeName}
              </Typography>
              {h.homeCode && (
                <Typography variant='caption' sx={{ color: 'text.disabled', fontWeight: 600, letterSpacing: 1 }}>
                  {h.homeCode}
                </Typography>
              )}
            </Stack>

            {/* Score or VS */}
            <Stack alignItems='center' spacing={0.5} sx={{ flexShrink: 0 }}>
              {(isLive || isFinished) && hasScore ? (
                <Typography
                  sx={{
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.5rem' },
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: { xs: 4, md: 6 },
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {h.scoreHome} – {h.scoreAway}
                </Typography>
              ) : hasScore ? (
                /* finished but shown during scheduled view — shouldn't happen often */
                <Typography
                  sx={{
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.5rem' },
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: { xs: 4, md: 6 },
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {h.scoreHome} – {h.scoreAway}
                </Typography>
              ) : (
                <Stack alignItems='center' spacing={0.25}>
                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.5rem' },
                      fontWeight: 200,
                      color: 'text.secondary',
                      lineHeight: 1
                    }}
                  >
                    vs
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {fmtTime(h.kickoffAt)}
                  </Typography>
                </Stack>
              )}
            </Stack>

            {/* Away team */}
            <Stack alignItems='center' spacing={1} sx={{ flex: 1, minWidth: 0 }}>
              <TeamFlag teamCode={h.awayCode} teamName={h.awayName} size={52} />
              <Typography
                fontWeight={800}
                textAlign='center'
                sx={{
                  fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' },
                  lineHeight: 1.25,
                  maxWidth: { xs: 90, sm: 130 }
                }}
              >
                {h.awayName}
              </Typography>
              {h.awayCode && (
                <Typography variant='caption' sx={{ color: 'text.disabled', fontWeight: 600, letterSpacing: 1 }}>
                  {h.awayCode}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* ── Row 3: scorers — only rendered when real events exist ── */}
          {h.events.length > 0 && (
            <Box sx={{ pb: 2 }}>
              <ScorerList events={h.events} />
            </Box>
          )}

          {/* ── Row 4: metadata strip ── */}
          <Box
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider',
              pt: 2
            }}
          >
            <Stack direction='row' alignItems='stretch' sx={{ width: '100%' }} divider={<MetaDivider />}>
              <MetaBlock
                icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                primary={fmtDate(h.kickoffAt)}
                secondary={`${fmtTime(h.kickoffAt)} ART`}
              />
              <MetaBlock
                icon={<StadiumIcon sx={{ fontSize: 16 }} />}
                primary={h.venueName || '–'}
                secondary={h.venueCity || undefined}
              />
              <MetaBlock
                icon={<GroupsIcon sx={{ fontSize: 16 }} />}
                primary={h.groupCode ? `Grupo ${h.groupCode}` : stageLabel}
                secondary={h.displayOrder != null ? `Partido #${h.displayOrder}` : undefined}
              />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Timeline card ─────────────────────────────────────────────────────────────

type EventIconProps = { type: MatchDetailEvent['type'] };

function EventIcon({ type }: EventIconProps) {
  if (type === 'own_goal') {
    return <SportsSoccerIcon sx={{ fontSize: 15, color: 'error.main' }} />;
  }
  return <SportsSoccerIcon sx={{ fontSize: 15, color: 'success.light' }} />;
}

function eventSuffix(type: MatchDetailEvent['type']): string {
  if (type === 'penalty_goal') return ' (P)';
  if (type === 'own_goal') return ' (OG)';
  return '';
}

function TimelineEventRow({
  event,
  homeCode,
  awayCode,
}: {
  event: MatchDetailEvent;
  homeCode: string;
  awayCode: string;
}) {
  const teamCode = event.side === 'home' ? homeCode : awayCode;
  const suffix = eventSuffix(event.type);

  return (
    <Stack
      direction='row'
      alignItems='center'
      spacing={1.5}
      sx={{
        py: 1,
        px: 0.5,
        borderRadius: 1,
        '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Typography
        variant='caption'
        sx={{
          color: 'text.disabled',
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
          minWidth: 28,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {event.minute}
      </Typography>

      <Box sx={{ display: 'flex', flexShrink: 0 }}>
        <EventIcon type={event.type} />
      </Box>

      <Typography
        variant='body2'
        sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}
      >
        {event.player}
        {suffix && (
          <Typography
            component='span'
            variant='caption'
            sx={{ color: 'text.secondary', ml: 0.5 }}
          >
            {suffix}
          </Typography>
        )}
      </Typography>

      {teamCode && (
        <Typography
          variant='caption'
          sx={{
            color: 'text.disabled',
            fontWeight: 600,
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        >
          {teamCode}
        </Typography>
      )}
    </Stack>
  );
}

function MatchTimelineCard({
  match,
  detail,
}: {
  match: Match;
  detail: MatchDetailPayload | null;
}) {
  const status = detail?.status ?? match.status;
  const events = detail?.events ?? [];
  const homeCode = detail?.homeTeam.code ?? match.homeTeamCode ?? '';
  const awayCode = detail?.awayTeam.code ?? match.awayTeamCode ?? '';
  const isScheduled = status === 'scheduled';
  const hasEvents = events.length > 0;

  return (
    <Card elevation={0} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' alignItems='center' spacing={1}>
            <AccessTimeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            <Typography variant='subtitle1' fontWeight={800}>
              Cronología del partido
            </Typography>
          </Stack>

          {isScheduled ? (
            <Stack alignItems='center' spacing={1} sx={{ py: 3 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5 }} />
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                La cronología aparecerá cuando comience el encuentro.
              </Typography>
            </Stack>
          ) : hasEvents ? (
            <Stack
              divider={
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', mx: 0.5 }} />
              }
            >
              {events.map((e, i) => (
                <TimelineEventRow
                  key={i}
                  event={e}
                  homeCode={homeCode}
                  awayCode={awayCode}
                />
              ))}
            </Stack>
          ) : (
            <Stack alignItems='center' spacing={1} sx={{ py: 3 }}>
              <SportsSoccerIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.4 }} />
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                Aún no hay eventos registrados para este partido.
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Coming soon (unchanged) ───────────────────────────────────────────────────

function ComingSoonCard() {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={0.5}>
          <Typography variant='subtitle2' color='text.secondary' fontWeight={700}>
            Próximamente
          </Typography>
          <Typography variant='body2' color='text.disabled'>
            Estadísticas, alineaciones, eventos del partido y más estarán disponibles durante el Mundial.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: matches = [], isLoading } = useMatches();
  const { data: detail = null } = useMatchDetail(matchId);

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 6 }}>
        <CircularProgress />
      </Stack>
    );
  }

  const match = matches.find((m) => m.id === matchId) ?? null;

  if (!match) {
    return (
      <Stack spacing={2}>
        <Button
          component={RouterLink}
          to={routes.fixture}
          variant='text'
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: 'flex-start' }}
        >
          Volver al fixture
        </Button>
        <Typography variant='h6' color='text.secondary'>
          Partido no encontrado.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <MatchHero match={match} detail={detail} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <MatchTimelineCard match={match} detail={detail} />
        </Grid>
      </Grid>

      <ComingSoonCard />
    </Stack>
  );
}
