import { Card, CardContent, Chip, CircularProgress, Divider, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { useMatches } from '../hooks/useMatches';
import { PageHeader } from '../../../shared/components/PageHeader';
import type { Match, MatchStatus } from '../types/types';

function statusLabel(status: MatchStatus): string {
  if (status === 'live') return 'EN VIVO';
  if (status === 'finished') return 'Finalizado';
  return 'Programado';
}

function statusChipColor(status: MatchStatus): 'default' | 'error' | 'success' {
  if (status === 'live') return 'error';
  if (status === 'finished') return 'success';
  return 'default';
}

function formatKickoff(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function teamLabel(match: Match, side: 'home' | 'away'): string {
  return side === 'home'
    ? (match.homeTeamCode ?? match.homeTeam)
    : (match.awayTeamCode ?? match.awayTeam);
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
        <Typography variant='h6'>Partido no encontrado.</Typography>
      </Stack>
    );
  }

  const hasScore =
    match.status !== 'scheduled' &&
    match.officialHomeScore != null &&
    match.officialAwayScore != null;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={`${match.homeTeam} vs ${match.awayTeam}`}
        description={`${match.group} · ${match.stadium} · ${match.city}`}
      />

      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: match.status === 'live' ? 'error.main' : 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5} alignItems='center'>
            <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap justifyContent='center'>
              <Chip
                label={statusLabel(match.status)}
                color={statusChipColor(match.status)}
                variant={match.status === 'live' ? 'filled' : 'outlined'}
              />
              <Chip label={match.group} variant='outlined' />
            </Stack>

            {hasScore ? (
              <Stack direction='row' alignItems='center' spacing={3}>
                <Typography variant='h5' fontWeight={800} sx={{ minWidth: 60, textAlign: 'right' }}>
                  {teamLabel(match, 'home')}
                </Typography>
                <Typography variant='h2' fontWeight={900} sx={{ letterSpacing: 2 }}>
                  {match.officialHomeScore} – {match.officialAwayScore}
                </Typography>
                <Typography variant='h5' fontWeight={800} sx={{ minWidth: 60, textAlign: 'left' }}>
                  {teamLabel(match, 'away')}
                </Typography>
              </Stack>
            ) : (
              <Stack direction='row' alignItems='center' spacing={3}>
                <Typography variant='h5' fontWeight={800}>
                  {teamLabel(match, 'home')}
                </Typography>
                <Typography variant='h4' color='text.secondary' fontWeight={300}>
                  vs
                </Typography>
                <Typography variant='h5' fontWeight={800}>
                  {teamLabel(match, 'away')}
                </Typography>
              </Stack>
            )}

            <Divider flexItem />

            <Stack spacing={0.5} alignItems='center'>
              <Typography variant='body2' color='text.secondary'>
                {formatKickoff(match.kickoffAt)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {match.stadium} · {match.city}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
