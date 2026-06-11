import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Popover,
  Stack,
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

// ── Timeline helpers ──────────────────────────────────────────────────────────

const LEGEND_ITEMS: { type: MatchDetailEventType; label: string }[] = [
  { type: 'goal', label: 'Gol' },
  { type: 'yellow_card', label: 'Amarilla' },
  { type: 'red_card', label: 'Roja' },
  { type: 'substitution', label: 'Cambio' },
];

const LANE_BASE = 46;  // px — minimum height per team lane
const LEVEL_STEP = 22; // px — extra height per stacking level
const CLUSTER_GAP = 6; // % — clusters closer than this get stacked

// Priority used to pick the "dominant" event when a cluster has multiple types.
const TYPE_PRIORITY: Partial<Record<MatchDetailEventType, number>> = {
  goal: 6, penalty_goal: 5, own_goal: 4, red_card: 3, yellow_card: 2, substitution: 1,
};

type EventCluster = {
  key: string;
  minute: string;
  side: 'home' | 'away';
  position: number; // 0–100 %
  events: MatchDetailEvent[];
};

function groupEventsByMinute(events: MatchDetailEvent[]): EventCluster[] {
  const map = new Map<string, EventCluster>();
  for (const e of events) {
    const key = `${e.side}|${e.minute}`;
    if (!map.has(key)) {
      map.set(key, { key, minute: e.minute, side: e.side, position: minuteToPercent(e.minute), events: [] });
    }
    map.get(key)!.events.push(e);
  }
  return Array.from(map.values());
}

function dominantEvent(events: MatchDetailEvent[]): MatchDetailEvent {
  return events.reduce((best, e) =>
    (TYPE_PRIORITY[e.type] ?? 0) > (TYPE_PRIORITY[best.type] ?? 0) ? e : best
  );
}

// Stack levels for clusters of the same side that are too close positionally.
function computeClusterLevels(clusters: EventCluster[]): number[] {
  const levels = new Array(clusters.length).fill(0) as number[];
  for (let i = 1; i < clusters.length; i++) {
    for (let j = 0; j < i; j++) {
      if (
        clusters[i].side === clusters[j].side &&
        Math.abs(clusters[i].position - clusters[j].position) < CLUSTER_GAP
      ) {
        levels[i] = Math.max(levels[i], levels[j] + 1);
      }
    }
  }
  return levels;
}

// ── Cluster detail popover ────────────────────────────────────────────────────

function ClusterDetailContent({
  cluster,
  homeCode,
  awayCode,
}: {
  cluster: EventCluster;
  homeCode: string;
  awayCode: string;
}) {
  const teamCode = cluster.side === 'home' ? homeCode || 'Local' : awayCode || 'Visit.';
  return (
    <Stack spacing={0.75} sx={{ p: 1.5, minWidth: 150, maxWidth: 230 }}>
      <Typography variant='caption' sx={{ color: 'text.disabled', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
        {cluster.minute} · {teamCode}
      </Typography>
      {cluster.events.map((e, i) => (
        <Stack key={i} direction='row' alignItems='center' spacing={0.75}>
          <EventTypeIcon type={e.type} size={14} />
          <Typography variant='body2' sx={{ fontWeight: 500, lineHeight: 1.25, color: 'text.primary' }}>
            {formatPlayerName(e.player)}
            {e.type === 'penalty_goal' && <Typography component='span' variant='caption' sx={{ color: 'text.secondary', ml: 0.5 }}>(P)</Typography>}
            {e.type === 'own_goal' && <Typography component='span' variant='caption' sx={{ color: 'error.main', ml: 0.5 }}>(OG)</Typography>}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// ── Cluster marker ────────────────────────────────────────────────────────────

function ClusterMarker({
  cluster,
  level,
  onSelect,
}: {
  cluster: EventCluster;
  level: number;
  onSelect: (anchor: HTMLElement, c: EventCluster) => void;
}) {
  const dominant = dominantEvent(cluster.events);
  const { color } = useEventVisual(dominant.type);
  const isHome = cluster.side === 'home';
  const hasMultiple = cluster.events.length > 1;

  // home: anchor at bottom of lane, grows upward; away: anchor at top, grows downward
  const anchorProp = isHome ? 'bottom' : 'top';

  return (
    <Box
      component='button'
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => onSelect(e.currentTarget, cluster)}
      aria-label={`${cluster.minute}${hasMultiple ? ` ×${cluster.events.length}` : ` ${formatPlayerName(dominant.player)}`}`}
      sx={{
        position: 'absolute',
        left: `${cluster.position}%`,
        [anchorProp]: level * LEVEL_STEP,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: isHome ? 'column' : 'column-reverse',
        alignItems: 'center',
        gap: '2px',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        p: 0,
        zIndex: 2,
        '&:hover .cdot, &:focus-visible .cdot': {
          transform: 'scale(1.45)',
          boxShadow: `0 0 8px ${color}`,
        },
        '&:focus-visible': { outline: 'none' },
      }}
    >
      {/* minute [+ count] — furthest from line */}
      <Stack direction='row' alignItems='center' spacing='2px' sx={{ pointerEvents: 'none' }}>
        <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color, lineHeight: 1, whiteSpace: 'nowrap', textShadow: '0 1px 3px rgba(0,0,0,0.85)' }}>
          {cluster.minute}
        </Typography>
        {hasMultiple && (
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: alpha(color, 0.75), lineHeight: 1 }}>
            ×{cluster.events.length}
          </Typography>
        )}
      </Stack>
      {/* icon */}
      <Box sx={{ display: 'flex', pointerEvents: 'none' }}>
        <EventTypeIcon type={dominant.type} size={11} />
      </Box>
      {/* dot — closest to line */}
      <Box
        className='cdot'
        sx={{
          width: hasMultiple ? 11 : 9,
          height: hasMultiple ? 11 : 9,
          borderRadius: '50%',
          bgcolor: color,
          border: '2px solid',
          borderColor: 'background.paper',
          boxShadow: `0 0 4px ${color}80`,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          flexShrink: 0,
          ...(hasMultiple && { outline: `2px solid ${alpha(color, 0.35)}` }),
        }}
      />
    </Box>
  );
}

// ── MatchTimeline ─────────────────────────────────────────────────────────────

function MatchTimeline({
  events,
  status,
  minuteLabel,
  homeCode,
  awayCode,
}: {
  events: MatchDetailEvent[];
  status: string;
  minuteLabel: string | null;
  homeCode: string;
  awayCode: string;
}) {
  const theme = useTheme();
  const [popover, setPopover] = React.useState<{ anchor: HTMLElement; cluster: EventCluster } | null>(null);

  const timelineEvents = getTimelineEvents(events);
  const clusters = groupEventsByMinute(timelineEvents);
  const levels = computeClusterLevels(clusters);

  const homeClusters = clusters.filter((c) => c.side === 'home');
  const awayClusters = clusters.filter((c) => c.side === 'away');

  const maxHomeLevel = homeClusters.length > 0
    ? Math.max(...homeClusters.map((c) => levels[clusters.indexOf(c)]))
    : 0;
  const maxAwayLevel = awayClusters.length > 0
    ? Math.max(...awayClusters.map((c) => levels[clusters.indexOf(c)]))
    : 0;

  const homeLaneH = LANE_BASE + maxHomeLevel * LEVEL_STEP;
  const awayLaneH = LANE_BASE + maxAwayLevel * LEVEL_STEP;
  const totalH = homeLaneH + 20 + awayLaneH;

  const liveMinute = status === 'live' && minuteLabel ? parseMinute(minuteLabel) : null;
  const progressPct = liveMinute != null
    ? Math.min((liveMinute / TIMELINE_MAX) * 100, 100)
    : status === 'finished' ? 100 : 0;

  const htPct = (45 / TIMELINE_MAX) * 100;
  const ftPct = (90 / TIMELINE_MAX) * 100;

  function handleSelect(anchor: HTMLElement, c: EventCluster) {
    setPopover((prev) => (prev?.cluster === c ? null : { anchor, cluster: c }));
  }

  return (
    <Box sx={{ py: 0.5 }}>
      <Stack direction='row' alignItems='stretch' spacing={0}>

        {/* Left column: team flags + codes */}
        <Stack
          sx={{ width: 38, flexShrink: 0, pr: 1, height: totalH, userSelect: 'none' }}
          justifyContent='space-between'
        >
          {/* Home: top-aligned */}
          <Stack alignItems='flex-end' spacing={0.25} sx={{ pt: 0.25 }}>
            <TeamFlag teamCode={homeCode} size={14} />
            <Typography sx={{ fontSize: '0.52rem', fontWeight: 800, color: 'text.disabled', letterSpacing: 0.3, lineHeight: 1, textAlign: 'right' }}>
              {homeCode || 'LOC'}
            </Typography>
          </Stack>
          {/* Away: bottom-aligned */}
          <Stack alignItems='flex-end' spacing={0.25} sx={{ pb: 0.25 }}>
            <TeamFlag teamCode={awayCode} size={14} />
            <Typography sx={{ fontSize: '0.52rem', fontWeight: 800, color: 'text.disabled', letterSpacing: 0.3, lineHeight: 1, textAlign: 'right' }}>
              {awayCode || 'VIS'}
            </Typography>
          </Stack>
        </Stack>

        {/* Right column: track */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Home lane — clusters anchored at bottom */}
          <Box sx={{ position: 'relative', height: homeLaneH }}>
            {homeClusters.map((c) => (
              <ClusterMarker
                key={c.key}
                cluster={c}
                level={levels[clusters.indexOf(c)]}
                onSelect={handleSelect}
              />
            ))}
          </Box>

          {/* Center line */}
          <Box sx={{ position: 'relative', height: 20 }}>
            {/* Track */}
            <Box sx={{ position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: 2, bgcolor: alpha(theme.palette.common.white, 0.10), borderRadius: 1 }} />
            {/* Progress */}
            {progressPct > 0 && (
              <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: `${progressPct}%`, height: 2, bgcolor: status === 'live' ? theme.palette.success.main : alpha(theme.palette.common.white, 0.22), borderRadius: 1, transition: 'width 1s ease' }} />
            )}
            {/* 0' */}
            <Typography sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(4px)', fontSize: '0.48rem', color: 'text.disabled', lineHeight: 1 }}>0'</Typography>
            {/* HT */}
            <Box sx={{ position: 'absolute', left: `${htPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 1, height: 8, bgcolor: alpha(theme.palette.common.white, 0.25) }} />
              <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', lineHeight: 1, mt: '1px' }}>HT</Typography>
            </Box>
            {/* FT */}
            <Box sx={{ position: 'absolute', left: `${ftPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ width: 1, height: 8, bgcolor: alpha(theme.palette.common.white, 0.25) }} />
              <Typography sx={{ fontSize: '0.46rem', color: 'text.disabled', lineHeight: 1, mt: '1px' }}>FT</Typography>
            </Box>
            {/* Live cursor */}
            {status === 'live' && liveMinute != null && (
              <Box sx={{ position: 'absolute', left: `${progressPct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', bgcolor: theme.palette.success.main, border: '2px solid', borderColor: 'background.paper', boxShadow: `0 0 6px ${theme.palette.success.main}`, animation: 'lp 1.4s ease-in-out infinite', '@keyframes lp': { '0%,100%': { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }, '50%': { opacity: 0.6, transform: 'translate(-50%,-50%) scale(1.3)' } }, zIndex: 3 }} />
            )}
          </Box>

          {/* Away lane — clusters anchored at top */}
          <Box sx={{ position: 'relative', height: awayLaneH }}>
            {awayClusters.map((c) => (
              <ClusterMarker
                key={c.key}
                cluster={c}
                level={levels[clusters.indexOf(c)]}
                onSelect={handleSelect}
              />
            ))}
          </Box>

        </Box>
      </Stack>

      {/* Cluster detail popover */}
      <Popover
        open={Boolean(popover)}
        anchorEl={popover?.anchor ?? null}
        onClose={() => setPopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        disableRestoreFocus
        slotProps={{
          paper: {
            elevation: 8,
            sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 0.5 },
          },
        }}
      >
        {popover && <ClusterDetailContent cluster={popover.cluster} homeCode={homeCode} awayCode={awayCode} />}
      </Popover>
    </Box>
  );
}

// ── MatchTimelineCard ─────────────────────────────────────────────────────────

function MatchTimelineCard({ match, detail }: { match: Match; detail: MatchDetailPayload | null }) {
  const status = detail?.status ?? match.status;
  const events = detail?.events ?? [];
  const minuteLabel = detail?.minuteLabel ?? null;
  const homeCode = detail?.homeTeam.code ?? match.homeTeamCode ?? '';
  const awayCode = detail?.awayTeam.code ?? match.awayTeamCode ?? '';
  const isScheduled = status === 'scheduled';
  const hasEvents = getTimelineEvents(events).length > 0;

  return (
    <Card elevation={0} sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' alignItems='center' justifyContent='space-between' flexWrap='wrap' gap={1}>
            <Stack direction='row' alignItems='center' spacing={1}>
              <AccessTimeIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              <Typography variant='subtitle1' fontWeight={800}>Cronología del partido</Typography>
            </Stack>
            {!isScheduled && (
              <Stack direction='row' spacing={1.5} flexWrap='wrap'>
                {LEGEND_ITEMS.map((item) => (
                  <Stack key={item.type} direction='row' alignItems='center' spacing={0.5}>
                    <EventTypeIcon type={item.type} size={12} />
                    <Typography variant='caption' sx={{ color: 'text.secondary', fontSize: '0.68rem' }}>{item.label}</Typography>
                  </Stack>
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
            <MatchTimeline events={events} status={status} minuteLabel={minuteLabel} homeCode={homeCode} awayCode={awayCode} />
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
