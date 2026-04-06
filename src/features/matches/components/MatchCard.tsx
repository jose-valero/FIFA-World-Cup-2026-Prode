import { Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import type { Match } from '../types';

interface MatchCardProps {
  match: Match;
  predictionSummary?: string | null;
  onPredict: (match: Match) => void;
  isLocked?: boolean;
  lockMessage?: string;
}

function getStatusLabel(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'En vivo';
    case 'finished':
      return 'Finalizado';
    case 'scheduled':
    default:
      return 'Pendiente';
  }
}
function getStatusColor(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'scheduled':
    default:
      return 'warning';
  }
}
export function MatchCard({ match, predictionSummary, onPredict, isLocked = false, lockMessage }: MatchCardProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            <Stack spacing={1}>
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={match.group} size='small' variant='outlined' />
                <Chip
                  label={getStatusLabel(match.status)}
                  size='small'
                  color={getStatusColor(match.status)}
                  variant='outlined'
                />
              </Stack>

              <Typography variant='h6' fontWeight={800}>
                {match.homeTeam} vs {match.awayTeam}
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                {match.kickoff}
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                {match.stadium} · {match.city}
              </Typography>
            </Stack>
          </Stack>

          <Divider />

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Stack spacing={0.5}>
              <Typography variant='body2' color='text.secondary'>
                Tu pronóstico
              </Typography>

              {isLocked && lockMessage ? (
                <Typography variant='caption' color='warning.main'>
                  {lockMessage}
                </Typography>
              ) : null}

              <Typography fontWeight={700}>{predictionSummary || 'Aún no has cargado un pronóstico'}</Typography>
            </Stack>

            <Button
              disabled={isLocked}
              variant={predictionSummary ? 'outlined' : 'contained'}
              onClick={() => onPredict(match)}
              sx={{ minWidth: 180 }}
            >
              {isLocked ? 'Pronóstico bloqueado' : predictionSummary ? 'Editar pronóstico' : 'Cargar pronóstico'}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
