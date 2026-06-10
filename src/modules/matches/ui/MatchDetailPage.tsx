import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink, useNavigate, useParams } from 'react-router';
import { useMatches } from '../hooks/useMatches';
import { useMatchDetail } from '../hooks/useMatchDetail';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { getStageLabel } from '../../tournament/utils/stages';
import { routes } from '../../../app/router/routes';
import type { Match } from '../types/types';
import type { MatchDetailPayload, MatchDetailEvent } from '../types/matchDetail.types';

// ── Formatters ────────────────────────────────────────────────────────────────

function formatKickoffLong(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function formatKickoffShort(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status, minuteLabel }: { status: string; minuteLabel: string | null }) {
  const isLive = status === 'live';
  const isFinished = status === 'finished';

  let label: string;
  if (isLive) {
    label = minuteLabel ? `EN VIVO ${minuteLabel}` : 'EN VIVO';
  } else if (isFinished) {
    label = 'Finalizado';
  } else {
    label = 'Pendiente';
  }

  return (
    <Chip
      label={label}
      color={isLive ? 'error' : isFinished ? 'success' : 'warning'}
      variant={isLive ? 'filled' : 'outlined'}
      size='small'
    />
  );
}

// ── Events list ───────────────────────────────────────────────────────────────

function eventIcon(type: MatchDetailEvent['type']): string {
  switch (type) {
    case 'penalty_goal': return '⚽ (P)';
    case 'own_goal':     return '⚽ (OG)';
    default:             return '⚽';
  }
}

function EventsRow({ events, homeCode, awayCode }: {
  events: MatchDetailEvent[];
  homeCode: string;
  awayCode: string;
}) {
  if (events.length === 0) return null;

  const homeEvents = events.filter((e) => e.side === 'home');
  const awayEvents = events.filter((e) => e.side === 'away');

  function renderList(evts: MatchDetailEvent[], align: 'left' | 'right') {
    return (
      <Stack spacing={0.25} alignItems={align === 'right' ? 'flex-end' : 'flex-start'}>
        {evts.map((e, i) => (
          <Typography key={i} variant='caption' color='text.secondary' sx={{ lineHeight: 1.4 }}>
            {align === 'right'
              ? `${e.minute} ${e.player || homeCode} ${eventIcon(e.type)}`
              : `${eventIcon(e.type)} ${e.player || awayCode} ${e.minute}`}
          </Typography>
        ))}
      </Stack>
    );
  }

  return (
    <Stack direction='row' justifyContent='center' spacing={4} sx={{ pt: 0.5 }}>
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {renderList(homeEvents, 'right')}
      </Box>
      <Box sx={{ width: 48 }} />
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        {renderList(awayEvents, 'left')}
      </Box>
    </Stack>
  );
}

// ── Match hero ────────────────────────────────────────────────────────────────

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
  espnEnriched: boolean;
};

function heroFromDetail(d: MatchDetailPayload): HeroData {
  return {
    status:       d.status,
    minuteLabel:  d.minuteLabel,
    homeCode:     d.homeTeam.code,
    awayCode:     d.awayTeam.code,
    homeName:     d.homeTeam.name,
    awayName:     d.awayTeam.name,
    scoreHome:    d.score?.home ?? null,
    scoreAway:    d.score?.away ?? null,
    events:       d.events,
    kickoffAt:    d.kickoffAt,
    venueName:    d.venueName,
    venueCity:    d.venueCity,
    stage:        d.stage,
    groupCode:    d.groupCode,
    espnEnriched: d.espnEnriched,
  };
}

function heroFromMatch(m: Match): HeroData {
  return {
    status:       m.status,
    minuteLabel:  null,
    homeCode:     m.homeTeamCode ?? '',
    awayCode:     m.awayTeamCode ?? '',
    homeName:     m.homeTeam,
    awayName:     m.awayTeam,
    scoreHome:    m.officialHomeScore,
    scoreAway:    m.officialAwayScore,
    events:       [],
    kickoffAt:    m.kickoffAt,
    venueName:    m.stadium,
    venueCity:    m.city,
    stage:        m.stage,
    groupCode:    m.groupCode,
    espnEnriched: false,
  };
}

function MatchHero({ match, detail }: { match: Match; detail: MatchDetailPayload | null }) {
  const navigate = useNavigate();

  function handleBack() {
    const canGoBack = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (canGoBack > 0) {
      navigate(-1);
    } else {
      navigate(routes.fixture);
    }
  }

  const h = detail ? heroFromDetail(detail) : heroFromMatch(match);
  const isLive = h.status === 'live';
  const hasScore = h.scoreHome != null && h.scoreAway != null;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: isLive ? 'error.main' : 'divider',
        overflow: 'hidden'
      }}
    >
      {isLive && <Box sx={{ height: 3, bgcolor: 'error.main' }} />}

      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          {/* Back + breadcrumb */}
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <IconButton onClick={handleBack} size='small' aria-label='Volver atrás'>
              <ArrowBackIcon fontSize='small' />
            </IconButton>
            <Stack direction='row' spacing={0.75} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography variant='caption' color='text.secondary'>
                {getStageLabel(h.stage as Parameters<typeof getStageLabel>[0])}
              </Typography>
              {h.groupCode ? (
                <Typography variant='caption' color='text.secondary'>
                  · Grupo {h.groupCode}
                </Typography>
              ) : null}
            </Stack>
          </Stack>

          {/* Status + date */}
          <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
            <StatusChip status={h.status} minuteLabel={h.minuteLabel} />
            <Typography variant='body2' color='text.secondary'>
              {formatKickoffLong(h.kickoffAt)}
            </Typography>
          </Stack>

          {/* Teams + score */}
          <Grid
            container
            alignItems='center'
            justifyContent='center'
            spacing={{ xs: 2, md: 4 }}
            sx={{ py: { xs: 1, md: 2 } }}
          >
            <Grid size={{ xs: 'auto' }}>
              <Stack alignItems='center' spacing={1}>
                <TeamFlag teamCode={h.homeCode} teamName={h.homeName} size={40} />
                <Typography variant='h6' fontWeight={800} textAlign='center' sx={{ maxWidth: 130 }}>
                  {h.homeName}
                </Typography>
                {h.homeCode ? (
                  <Typography variant='caption' color='text.secondary'>{h.homeCode}</Typography>
                ) : null}
              </Stack>
            </Grid>

            <Grid size={{ xs: 'auto' }}>
              <Stack alignItems='center' spacing={0.5}>
                {hasScore ? (
                  <Typography variant='h2' fontWeight={900} sx={{ letterSpacing: 4, lineHeight: 1 }}>
                    {h.scoreHome} – {h.scoreAway}
                  </Typography>
                ) : (
                  <>
                    <Typography variant='h3' fontWeight={300} color='text.secondary'>vs</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {new Date(h.kickoffAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </>
                )}
              </Stack>
            </Grid>

            <Grid size={{ xs: 'auto' }}>
              <Stack alignItems='center' spacing={1}>
                <TeamFlag teamCode={h.awayCode} teamName={h.awayName} size={40} />
                <Typography variant='h6' fontWeight={800} textAlign='center' sx={{ maxWidth: 130 }}>
                  {h.awayName}
                </Typography>
                {h.awayCode ? (
                  <Typography variant='caption' color='text.secondary'>{h.awayCode}</Typography>
                ) : null}
              </Stack>
            </Grid>
          </Grid>

          {/* Scoring events under the score */}
          {h.events.length > 0 ? (
            <EventsRow events={h.events} homeCode={h.homeCode} awayCode={h.awayCode} />
          ) : null}

          {/* Venue */}
          {h.venueName || h.venueCity ? (
            <Stack alignItems='center'>
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                {[h.venueName, h.venueCity].filter(Boolean).join(' · ')}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Info card ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction='row' justifyContent='space-between' alignItems='baseline' spacing={1}>
      <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>{label}</Typography>
      <Typography variant='body2' fontWeight={600} textAlign='right'>{value}</Typography>
    </Stack>
  );
}

function MatchContextCard({ match }: { match: Match }) {
  const rows = [
    { label: 'Fase', value: getStageLabel(match.stage) },
    ...(match.groupCode ? [{ label: 'Grupo', value: `Grupo ${match.groupCode}` }] : []),
    ...(match.group && match.group !== `Grupo ${match.groupCode}` ? [{ label: 'Partido', value: match.group }] : []),
    { label: 'Kickoff', value: formatKickoffShort(match.kickoffAt) },
    ...(match.stadium ? [{ label: 'Estadio', value: match.stadium }] : []),
    ...(match.city ? [{ label: 'Ciudad', value: match.city }] : []),
    ...(match.displayOrder != null ? [{ label: 'Orden', value: `Partido #${match.displayOrder}` }] : [])
  ];

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant='subtitle1' fontWeight={800}>Datos del partido</Typography>
          <Stack spacing={1.25} divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
            {rows.map((row) => (
              <InfoRow key={row.label} label={row.label} value={row.value} />
            ))}
          </Stack>
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
          <Typography variant='subtitle2' color='text.secondary' fontWeight={700}>Próximamente</Typography>
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
        <Typography variant='h6' color='text.secondary'>Partido no encontrado.</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2.5}>
      <MatchHero match={match} detail={detail} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <MatchContextCard match={match} />
        </Grid>
      </Grid>

      <ComingSoonCard />
    </Stack>
  );
}
