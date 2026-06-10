import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';
import type { Match, MatchStatus } from '../../matches/types/types';
import { matchDetailPath } from '../../../app/router/routes';
import { TeamFlag } from '../../../shared/components/TeamFlag';

type Props = { matches: Match[] };

function statusChipColor(status: MatchStatus): 'default' | 'error' | 'success' {
  if (status === 'live') return 'error';
  if (status === 'finished') return 'success';
  return 'default';
}

function statusLabel(status: MatchStatus): string {
  if (status === 'live') return 'EN VIVO';
  if (status === 'finished') return 'Final';
  return 'Pendiente';
}

function kickoffTime(kickoffAt: string): string {
  return new Date(kickoffAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function TodayMatchesScroller({ matches }: Props) {
  const navigate = useNavigate();

  if (matches.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        Sin partidos hoy.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1.5,
        overflowX: 'auto',
        pb: 0.5,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { borderRadius: '8px', bgcolor: 'divider' }
      }}
    >
      {matches.map((match) => {
        const hasScore =
          match.status !== 'scheduled' &&
          match.officialHomeScore != null &&
          match.officialAwayScore != null;

        const homeLabel = match.homeTeamCode ?? match.homeTeam;
        const awayLabel = match.awayTeamCode ?? match.awayTeam;

        return (
          <Card
            key={match.id}
            elevation={0}
            sx={{
              minWidth: 190,
              maxWidth: 210,
              flexShrink: 0,
              border: '1px solid',
              borderColor: match.status === 'live' ? 'error.main' : 'divider',
              borderRadius: '8px'
            }}
          >
            <CardActionArea onClick={() => void navigate(matchDetailPath(match.id))} sx={{ height: '100%', borderRadius: '8px' }}>
              <CardContent sx={{ p: 1.5 }}>
                <Stack spacing={0.75}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Chip
                      label={statusLabel(match.status)}
                      color={statusChipColor(match.status)}
                      size='small'
                      variant={match.status === 'live' ? 'filled' : 'outlined'}
                      sx={{ fontSize: 10, height: 18, px: 0.25 }}
                    />
                    <Typography variant='caption' color='text.secondary'>
                      {kickoffTime(match.kickoffAt)}
                    </Typography>
                  </Stack>

                  {hasScore ? (
                    <Stack direction='row' alignItems='center' justifyContent='center' spacing={1}>
                      <Stack direction='row' alignItems='center' spacing={0.5} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                        <TeamFlag teamCode={match.homeTeamCode} teamName={match.homeTeam} size={14} />
                        <Typography variant='body2' noWrap fontWeight={700}>
                          {homeLabel}
                        </Typography>
                      </Stack>
                      <Typography variant='h6' fontWeight={900} sx={{ minWidth: 44, textAlign: 'center' }}>
                        {match.officialHomeScore}–{match.officialAwayScore}
                      </Typography>
                      <Stack direction='row' alignItems='center' spacing={0.5} sx={{ flex: 1, justifyContent: 'flex-start' }}>
                        <TeamFlag teamCode={match.awayTeamCode} teamName={match.awayTeam} size={14} />
                        <Typography variant='body2' noWrap fontWeight={700}>
                          {awayLabel}
                        </Typography>
                      </Stack>
                    </Stack>
                  ) : (
                    <Stack direction='row' alignItems='center' justifyContent='center' spacing={0.75}>
                      <Stack direction='row' alignItems='center' spacing={0.5} sx={{ flex: 1, justifyContent: 'flex-end' }}>
                        <TeamFlag teamCode={match.homeTeamCode} teamName={match.homeTeam} size={14} />
                        <Typography variant='body2' noWrap fontWeight={700}>
                          {homeLabel}
                        </Typography>
                      </Stack>
                      <Typography variant='caption' color='text.secondary' sx={{ minWidth: 20, textAlign: 'center' }}>
                        vs
                      </Typography>
                      <Stack direction='row' alignItems='center' spacing={0.5} sx={{ flex: 1, justifyContent: 'flex-start' }}>
                        <TeamFlag teamCode={match.awayTeamCode} teamName={match.awayTeam} size={14} />
                        <Typography variant='body2' noWrap fontWeight={700}>
                          {awayLabel}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}

                  <Typography variant='caption' color='text.secondary' noWrap sx={{ textAlign: 'center' }}>
                    {match.city}
                  </Typography>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}
