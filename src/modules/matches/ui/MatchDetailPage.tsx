import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
  useTheme
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StadiumIcon from '@mui/icons-material/Stadium';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StyleIcon from '@mui/icons-material/Style';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import React from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useMatches } from '../hooks/useMatches';
import { useMatchDetail } from '../hooks/useMatchDetail';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { getStageLabel } from '../../tournament/utils/stages';
import { routes } from '../../../app/router/routes';
import type { Match } from '../types/types';
import type { MatchDetailPayload, MatchDetailEvent, MatchDetailEventType } from '../types/matchDetail.types';

// ── Event helpers ─────────────────────────────────────────────────────────────

const REDUNDANT_SUFFIXES = [
  / goal - header$/i,
  / goal$/i,
  / yellow card$/i,
  / red card$/i,
  / substitution$/i,
  / penalty$/i,
  / own goal$/i
];

function formatPlayerName(raw: string): string {
  let name = raw.trim();
  for (const re of REDUNDANT_SUFFIXES) {
    const cleaned = name.replace(re, '').trim();
    if (cleaned.length > 0) {
      name = cleaned;
      break;
    }
  }
  return name;
}

function getGoalEvents(events: MatchDetailEvent[]): MatchDetailEvent[] {
  return events.filter((e) => e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal');
}

function getTimelineEvents(events: MatchDetailEvent[]): MatchDetailEvent[] {
  return events.filter(
    (e) =>
      e.type === 'goal' ||
      e.type === 'penalty_goal' ||
      e.type === 'own_goal' ||
      e.type === 'yellow_card' ||
      e.type === 'red_card' ||
      e.type === 'substitution'
  );
}

// Parse "9'", "45'+4'", "90'+2'" → numeric minute
function parseMinute(minuteStr: string): number {
  const base = minuteStr.replace(/'/g, '').trim();
  const [main, extra] = base.split('+').map((s) => parseInt(s.trim(), 10));
  return (isNaN(main) ? 0 : main) + (isNaN(extra) ? 0 : extra);
}

type EventVisual = {
  color: string;
  label: string;
};

function useEventVisual(type: MatchDetailEventType): EventVisual {
  const theme = useTheme();
  switch (type) {
    case 'goal':
    case 'penalty_goal':
      return { color: theme.palette.success.main, label: type === 'penalty_goal' ? 'Gol (P)' : 'Gol' };
    case 'own_goal':
      return { color: theme.palette.error.main, label: 'Gol en propia' };
    case 'yellow_card':
      return { color: theme.palette.warning.main, label: 'Amarilla' };
    case 'red_card':
      return { color: theme.palette.error.main, label: 'Roja' };
    case 'substitution':
      return { color: theme.palette.info.main, label: 'Cambio' };
  }
}

function EventTypeIcon({ type, size = 14 }: { type: MatchDetailEventType; size?: number }) {
  const theme = useTheme();
  const sx = { fontSize: size };

  switch (type) {
    case 'goal':
    case 'penalty_goal':
      return <SportsSoccerIcon sx={{ ...sx, color: theme.palette.success.main }} />;
    case 'own_goal':
      return <SportsSoccerIcon sx={{ ...sx, color: theme.palette.error.main }} />;
    case 'yellow_card':
      return (
        <StyleIcon
          sx={{
            ...sx,
            color: theme.palette.warning.main,
            transform: 'rotate(180deg)'
          }}
        />
      );
    case 'red_card':
      return (
        <StyleIcon
          sx={{
            ...sx,
            color: theme.palette.error.main,
            transform: 'rotate(180deg)'
          }}
        />
      );
    case 'substitution':
      return <SwapHorizIcon sx={{ ...sx, color: theme.palette.info.main }} />;
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long'
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

// ── Scorer list (goals only) ───────────────────────────────────────────────────

function ScorerList({ events }: { events: MatchDetailEvent[] }) {
  const goalEvents = getGoalEvents(events);
  const home = goalEvents.filter((e) => e.side === 'home');
  const away = goalEvents.filter((e) => e.side === 'away');

  if (home.length === 0 && away.length === 0) return null;

  const col = (list: MatchDetailEvent[], align: 'left' | 'right') => (
    <Stack spacing={0.4} alignItems={align === 'right' ? 'flex-end' : 'flex-start'} sx={{ flex: 1 }}>
      {list.map((e, i) => {
        const suffix = e.type === 'penalty_goal' ? ' (P)' : e.type === 'own_goal' ? ' (OG)' : '';
        return (
          <Stack key={i} direction='row' spacing={0.5} alignItems='center'>
            {align === 'left' && <SportsSoccerIcon sx={{ fontSize: 12, color: 'success.main', flexShrink: 0 }} />}
            <Typography variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.5, fontWeight: 500 }}>
              {formatPlayerName(e.player)}
              {suffix} {e.minute}
            </Typography>
            {align === 'right' && <SportsSoccerIcon sx={{ fontSize: 12, color: 'success.main', flexShrink: 0 }} />}
          </Stack>
        );
      })}
    </Stack>
  );

  return (
    <Stack direction='row' sx={{ width: '100%', px: { xs: 1, md: 2 } }}>
      {col(home, 'right')}
      <Box sx={{ width: { xs: 48, md: 64 }, flexShrink: 0 }} />
      {col(away, 'left')}
    </Stack>
  );
}

// ── HeroData abstraction ──────────────────────────────────────────────────────

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

function MetaBlockAction({
  icon,
  primary,
  isActive,
  onClick
}: {
  icon: React.ReactNode;
  primary: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      component='button'
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: 0,
        px: 1,
        py: 0,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        color: 'inherit',
        transition: 'opacity 0.15s ease',
        '&:hover': { opacity: 0.7 },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', borderRadius: 1 }
      }}
    >
      <Box sx={{ color: isActive ? 'primary.main' : 'text.disabled', display: 'flex', transition: 'color 0.2s ease' }}>
        {icon}
      </Box>
      <Typography
        variant='caption'
        fontWeight={700}
        textAlign='center'
        noWrap
        sx={{ width: '100%', color: isActive ? 'primary.main' : 'text.primary', transition: 'color 0.2s ease' }}
      >
        {primary}
      </Typography>
    </Box>
  );
}

// ── MatchHero ─────────────────────────────────────────────────────────────────

function MatchHero({
  match,
  detail,
  timelineOpen,
  onToggleTimeline
}: {
  match: Match;
  detail: MatchDetailPayload | null;
  timelineOpen: boolean;
  onToggleTimeline: () => void;
}) {
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
      {isLive && <Box sx={{ height: 3, bgcolor: 'success.main' }} />}
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Stack spacing={0}>
          {/* Row 1: back + breadcrumb + status badge */}
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

          {/* Row 2: teams + score */}
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='center'
            spacing={{ xs: 1.5, sm: 3, md: 4 }}
            sx={{ py: { xs: 1.5, md: 2.5 } }}
          >
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

          {/* Row 3: goal scorers only */}
          {getGoalEvents(h.events).length > 0 && (
            <Box sx={{ pb: 2 }}>
              <ScorerList events={h.events} />
            </Box>
          )}

          {/* Row 4: metadata strip */}
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
            <Stack direction='row' alignItems='stretch' sx={{ width: '100%' }} divider={<MetaDivider />}>
              <MetaBlock
                icon={<CalendarTodayIcon sx={{ fontSize: 16 }} />}
                primary={fmtDate(h.kickoffAt)}
                secondary={`${fmtTime(h.kickoffAt)}`}
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
              <MetaBlockAction
                icon={
                  <KeyboardArrowDownIcon
                    sx={{
                      fontSize: 16,
                      transform: timelineOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s ease'
                    }}
                  />
                }
                primary={timelineOpen ? 'Ocultar' : 'Cronología'}
                isActive={timelineOpen}
                onClick={onToggleTimeline}
              />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Vertical timeline ─────────────────────────────────────────────────────────

function MatchEventTimelineItem({ event }: { event: MatchDetailEvent }) {
  const { color, label } = useEventVisual(event.type);
  const isHome = event.side === 'home';
  const playerName = formatPlayerName(event.player);

  const suffix = event.type === 'penalty_goal' ? ' (P)' : event.type === 'own_goal' ? ' (OG)' : '';

  const content = (
    <Stack spacing={0.25} alignItems={isHome ? 'flex-end' : 'flex-start'}>
      <Typography variant='caption' fontWeight={700} sx={{ lineHeight: 1.3, color: 'text.primary' }}>
        {playerName}
      </Typography>
      <Stack direction='row' alignItems='center' spacing={0.4}>
        {!isHome && <EventTypeIcon type={event.type} size={11} />}
        <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>
          {label}
          {suffix}
        </Typography>
        {isHome && <EventTypeIcon type={event.type} size={11} />}
      </Stack>
    </Stack>
  );

  return (
    <Stack direction='row' alignItems='center'>
      {/* Left — home events */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', pr: 1.5, py: 0.85 }}>
        {isHome ? content : null}
      </Box>

      {/* Center — dot + minute */}
      <Box
        sx={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
      >
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: color,
            border: '2px solid',
            borderColor: 'background.default',
            zIndex: 1,
            flexShrink: 0,
            boxShadow: `0 0 6px ${color}55`
          }}
        />
        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color, lineHeight: 1, whiteSpace: 'nowrap' }}>
          {event.minute}
        </Typography>
      </Box>

      {/* Right — away events */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', pl: 1.5, py: 0.85 }}>
        {!isHome ? content : null}
      </Box>
    </Stack>
  );
}

function MatchVerticalTimeline({ events, status }: { events: MatchDetailEvent[]; status: string }) {
  const timelineEvents = getTimelineEvents(events);

  if (status === 'scheduled') {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 3 }}>
        <AccessTimeIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5 }} />
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          La cronología aparecerá cuando comience el encuentro.
        </Typography>
      </Stack>
    );
  }

  if (timelineEvents.length === 0) {
    return (
      <Stack alignItems='center' spacing={1} sx={{ py: 3 }}>
        <SportsSoccerIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.4 }} />
        <Typography variant='body2' color='text.secondary' textAlign='center'>
          Aún no hay eventos registrados para este partido.
        </Typography>
      </Stack>
    );
  }

  const sorted = [...timelineEvents].sort((a, b) => parseMinute(a.minute) - parseMinute(b.minute));

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Vertical center axis */}
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 2,
          bgcolor: 'divider',
          transform: 'translateX(-50%)',
          borderRadius: 1
        }}
      />
      <Stack>
        {sorted.map((event, i) => (
          <MatchEventTimelineItem key={i} event={event} />
        ))}
      </Stack>
    </Box>
  );
}

// ── Coming soon ───────────────────────────────────────────────────────────────

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
  const [timelineOpen, setTimelineOpen] = React.useState(false);

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

  const timelineStatus = detail?.status ?? match.status;
  const timelineEvents = detail?.events ?? [];

  return (
    <Stack spacing={2.5}>
      <MatchHero
        match={match}
        detail={detail}
        timelineOpen={timelineOpen}
        onToggleTimeline={() => setTimelineOpen((o) => !o)}
      />

      <Collapse in={timelineOpen} timeout={280} unmountOnExit>
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack spacing={1.5}>
              <Stack direction='row' alignItems='center' spacing={1}>
                <AccessTimeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                <Typography variant='subtitle1' fontWeight={800}>
                  Cronología del partido
                </Typography>
              </Stack>
              <MatchVerticalTimeline events={timelineEvents} status={timelineStatus} />
            </Stack>
          </CardContent>
        </Card>
      </Collapse>

      <ComingSoonCard />
    </Stack>
  );
}
