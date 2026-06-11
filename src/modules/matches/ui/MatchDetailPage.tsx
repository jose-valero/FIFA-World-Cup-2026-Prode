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
  Tooltip,
  Typography,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import StadiumIcon from '@mui/icons-material/Stadium';
import GroupsIcon from '@mui/icons-material/Groups';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import StyleIcon from '@mui/icons-material/Style';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
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
  / own goal$/i,
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
  return events.filter((e) =>
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

// Convert a minute string to a 0–100 percentage on the timeline (clamp at 100)
const TIMELINE_MAX = 95;
function minuteToPercent(minuteStr: string): number {
  const min = parseMinute(minuteStr);
  return Math.min((min / TIMELINE_MAX) * 100, 100);
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
              {formatPlayerName(e.player)}{suffix} {e.minute}
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
                sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.25, maxWidth: { xs: 90, sm: 130 } }}
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
                  <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, fontWeight: 200, color: 'text.secondary', lineHeight: 1 }}>
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
                sx={{ fontSize: { xs: '0.85rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.25, maxWidth: { xs: 90, sm: 130 } }}
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

// ── Timeline ──────────────────────────────────────────────────────────────────

const LEGEND_ITEMS: { type: MatchDetailEventType; label: string }[] = [
  { type: 'goal', label: 'Gol' },
  { type: 'yellow_card', label: 'Amarilla' },
  { type: 'red_card', label: 'Roja' },
  { type: 'substitution', label: 'Cambio' },
];

function LegendItem({ type, label }: { type: MatchDetailEventType; label: string }) {
  return (
    <Stack direction='row' alignItems='center' spacing={0.5}>
      <EventTypeIcon type={type} size={13} />
      <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
        {label}
      </Typography>
    </Stack>
  );
}

type TimelineMarkerProps = {
  event: MatchDetailEvent;
  position: number; // 0–100%
  above: boolean;   // alternate above/below to reduce overlap
};

function TimelineMarker({ event, position, above }: TimelineMarkerProps) {
  const { color } = useEventVisual(event.type);
  const playerName = formatPlayerName(event.player);

  return (
    <Tooltip
      title={`${event.minute} · ${playerName}`}
      placement={above ? 'top' : 'bottom'}
      arrow
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${position}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: above ? '2px' : 0,
          cursor: 'default',
          zIndex: 2,
        }}
      >
        {/* Label above */}
        {above && (
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              mb: 0.25,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {event.minute}
          </Typography>
        )}

        {/* Dot */}
        <Box
          sx={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            bgcolor: color,
            border: '2px solid',
            borderColor: 'background.paper',
            boxShadow: `0 0 6px ${color}80`,
            flexShrink: 0,
          }}
        />

        {/* Label below */}
        {!above && (
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 700,
              color,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              mt: 0.25,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
            }}
          >
            {event.minute}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

function MatchTimeline({
  events,
  status,
  minuteLabel,
}: {
  events: MatchDetailEvent[];
  status: string;
  minuteLabel: string | null;
}) {
  const theme = useTheme();
  const timelineEvents = getTimelineEvents(events);

  // Current live minute for the progress indicator
  const liveMinute = status === 'live' && minuteLabel ? parseMinute(minuteLabel) : null;
  const progressPercent = liveMinute != null ? Math.min((liveMinute / TIMELINE_MAX) * 100, 100) : status === 'finished' ? 100 : 0;

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
      {/* Timeline track — scrollable on mobile */}
      <Box sx={{ overflowX: 'auto', overflowY: 'visible', pb: 1 }}>
        <Box sx={{ minWidth: 320, position: 'relative', py: 4 }}>
          {/* Track background */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              height: 3,
              bgcolor: alpha(theme.palette.common.white, 0.08),
              borderRadius: 2,
            }}
          />

          {/* Progress fill */}
          {progressPercent > 0 && (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: `${progressPercent}%`,
                height: 3,
                bgcolor: status === 'live' ? theme.palette.success.main : alpha(theme.palette.common.white, 0.20),
                borderRadius: 2,
                transition: 'width 1s ease',
              }}
            />
          )}

          {/* HT marker */}
          <Box sx={{ position: 'absolute', left: `${(45 / TIMELINE_MAX) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <Box sx={{ width: 2, height: 14, bgcolor: alpha(theme.palette.common.white, 0.20), borderRadius: 1 }} />
            <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', textAlign: 'center', mt: 0.5, whiteSpace: 'nowrap', ml: '-6px' }}>
              HT
            </Typography>
          </Box>

          {/* FT marker */}
          <Box sx={{ position: 'absolute', left: `${(90 / TIMELINE_MAX) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }}>
            <Box sx={{ width: 2, height: 14, bgcolor: alpha(theme.palette.common.white, 0.20), borderRadius: 1 }} />
            <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', textAlign: 'center', mt: 0.5, whiteSpace: 'nowrap', ml: '-5px' }}>
              FT
            </Typography>
          </Box>

          {/* Live cursor */}
          {status === 'live' && liveMinute != null && (
            <Box
              sx={{
                position: 'absolute',
                left: `${progressPercent}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: theme.palette.success.main,
                border: '2px solid',
                borderColor: 'background.paper',
                boxShadow: `0 0 8px ${theme.palette.success.main}`,
                animation: 'pulse 1.4s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                  '50%': { opacity: 0.7, transform: 'translate(-50%, -50%) scale(1.3)' },
                },
                zIndex: 3,
              }}
            />
          )}

          {/* Event markers */}
          {timelineEvents.map((e, i) => (
            <TimelineMarker
              key={i}
              event={e}
              position={minuteToPercent(e.minute)}
              above={i % 2 === 0}
            />
          ))}
        </Box>
      </Box>

      {/* Event list below the track (compact) */}
      {timelineEvents.length > 0 && (
        <Stack spacing={0} sx={{ mt: 1, borderTop: '1px solid', borderColor: 'divider', pt: 1.5 }}>
          {timelineEvents.map((e, i) => (
            <TimelineEventListRow key={i} event={e} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function TimelineEventListRow({ event }: { event: MatchDetailEvent }) {
  const { color } = useEventVisual(event.type);

  return (
    <Stack
      direction='row'
      alignItems='center'
      spacing={1.5}
      sx={{
        py: 0.75,
        px: 0.5,
        borderRadius: 1,
        '&:hover': { bgcolor: alpha('#ffffff', 0.03) },
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
        <EventTypeIcon type={event.type} size={15} />
      </Box>

      <Typography variant='body2' sx={{ flex: 1, fontWeight: 500, color: 'text.primary' }}>
        {formatPlayerName(event.player)}
        {event.type === 'penalty_goal' && (
          <Typography component='span' variant='caption' sx={{ color: 'text.secondary', ml: 0.5 }}>
            (P)
          </Typography>
        )}
        {event.type === 'own_goal' && (
          <Typography component='span' variant='caption' sx={{ color: 'error.main', ml: 0.5 }}>
            (OG)
          </Typography>
        )}
      </Typography>

      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0, opacity: 0.8 }} />
    </Stack>
  );
}

// ── MatchTimelineCard ─────────────────────────────────────────────────────────

function MatchTimelineCard({ match, detail }: { match: Match; detail: MatchDetailPayload | null }) {
  const status = detail?.status ?? match.status;
  const events = detail?.events ?? [];
  const minuteLabel = detail?.minuteLabel ?? null;
  const isScheduled = status === 'scheduled';
  const hasEvents = getTimelineEvents(events).length > 0;

  return (
    <Card elevation={0} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          {/* Header row */}
          <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <AccessTimeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              <Typography variant='subtitle1' fontWeight={800}>
                Cronología del partido
              </Typography>
            </Stack>

            {/* Legend */}
            {!isScheduled && (
              <Stack direction='row' spacing={1.5} flexWrap='wrap'>
                {LEGEND_ITEMS.map((item) => (
                  <LegendItem key={item.type} type={item.type} label={item.label} />
                ))}
              </Stack>
            )}
          </Stack>

          {isScheduled ? (
            <Stack alignItems='center' spacing={1} sx={{ py: 3 }}>
              <AccessTimeIcon sx={{ fontSize: 32, color: 'text.disabled', opacity: 0.5 }} />
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                La cronología aparecerá cuando comience el encuentro.
              </Typography>
            </Stack>
          ) : hasEvents ? (
            <MatchTimeline events={events} status={status} minuteLabel={minuteLabel} />
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
