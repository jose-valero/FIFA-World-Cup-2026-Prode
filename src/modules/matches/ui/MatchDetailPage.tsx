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
import { useAuth } from '../../auth/hooks/useAuth';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { getStageLabel } from '../../tournament/utils/stages';
import { routes } from '../../../app/router/routes';
import type { Match } from '../types/types';

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

function MatchHero({ match }: { match: Match }) {
  const navigate = useNavigate();

  function handleBack() {
    const canGoBack = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (canGoBack > 0) {
      navigate(-1);
    } else {
      navigate(routes.fixture);
    }
  }

  const hasScore =
    match.status !== 'scheduled' &&
    match.officialHomeScore != null &&
    match.officialAwayScore != null;

  const isLive = match.status === 'live';

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
      {isLive && (
        <Box sx={{ height: 3, bgcolor: 'error.main' }} />
      )}

      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2.5}>
          {/* Top row: back + breadcrumb */}
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <IconButton onClick={handleBack} size='small' aria-label='Volver atrás'>
              <ArrowBackIcon fontSize='small' />
            </IconButton>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography variant='caption' color='text.secondary'>
                {getStageLabel(match.stage)}
              </Typography>
              {match.groupCode ? (
                <>
                  <Typography variant='caption' color='text.secondary'>·</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    Grupo {match.groupCode}
                  </Typography>
                </>
              ) : null}
            </Stack>
          </Stack>

          {/* Status + date row */}
          <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
            <Chip
              label={match.status === 'live' ? 'EN VIVO' : match.status === 'finished' ? 'Finalizado' : 'Pendiente'}
              color={match.status === 'live' ? 'error' : match.status === 'finished' ? 'success' : 'warning'}
              variant={match.status === 'live' ? 'filled' : 'outlined'}
              size='small'
            />
            <Typography variant='body2' color='text.secondary'>
              {formatKickoffLong(match.kickoffAt)}
            </Typography>
          </Stack>

          {/* Teams + score */}
          <Grid
            container
            alignItems='center'
            justifyContent='center'
            spacing={{ xs: 1.5, md: 3 }}
            sx={{ py: { xs: 1, md: 2 } }}
          >
            {/* Home team */}
            <Grid size={{ xs: 'auto', md: 'auto' }}>
              <Stack alignItems='center' spacing={1}>
                <TeamFlag teamCode={match.homeTeamCode} teamName={match.homeTeam} size={36} />
                <Typography variant='h6' fontWeight={800} textAlign='center' sx={{ maxWidth: 120 }}>
                  {match.homeTeam}
                </Typography>
                {match.homeTeamCode ? (
                  <Typography variant='caption' color='text.secondary'>
                    {match.homeTeamCode}
                  </Typography>
                ) : null}
              </Stack>
            </Grid>

            {/* Score or time */}
            <Grid size={{ xs: 'auto', md: 'auto' }}>
              <Stack alignItems='center' spacing={0.5}>
                {hasScore ? (
                  <Typography
                    variant='h2'
                    fontWeight={900}
                    sx={{ letterSpacing: 4, lineHeight: 1 }}
                  >
                    {match.officialHomeScore} – {match.officialAwayScore}
                  </Typography>
                ) : (
                  <>
                    <Typography variant='h3' fontWeight={300} color='text.secondary'>
                      vs
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {new Date(match.kickoffAt).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Typography>
                  </>
                )}
              </Stack>
            </Grid>

            {/* Away team */}
            <Grid size={{ xs: 'auto', md: 'auto' }}>
              <Stack alignItems='center' spacing={1}>
                <TeamFlag teamCode={match.awayTeamCode} teamName={match.awayTeam} size={36} />
                <Typography variant='h6' fontWeight={800} textAlign='center' sx={{ maxWidth: 120 }}>
                  {match.awayTeam}
                </Typography>
                {match.awayTeamCode ? (
                  <Typography variant='caption' color='text.secondary'>
                    {match.awayTeamCode}
                  </Typography>
                ) : null}
              </Stack>
            </Grid>
          </Grid>

          {/* Venue */}
          {match.stadium || match.city ? (
            <Stack alignItems='center'>
              <Typography variant='body2' color='text.secondary' textAlign='center'>
                {[match.stadium, match.city].filter(Boolean).join(' · ')}
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction='row' justifyContent='space-between' alignItems='baseline' spacing={1}>
      <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight={600} textAlign='right'>
        {value}
      </Typography>
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
    <Card
      elevation={0}
      sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', height: '100%' }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant='subtitle1' fontWeight={800}>
            Datos del partido
          </Typography>
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

function ComingSoonCard() {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent'
      }}
    >
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

export function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: matches = [], isLoading } = useMatches();

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
      <MatchHero match={match} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <MatchContextCard match={match} />
        </Grid>
      </Grid>

      <ComingSoonCard />
    </Stack>
  );
}
