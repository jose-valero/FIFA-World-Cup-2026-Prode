import { Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import type { Match } from '../types';
import { getStatusLabel } from '../helpers/getStatusLabel';
import { getStatusColor } from '../helpers/getStatusColor';
import { MatchVs } from './MatchVs';

interface MatchCardProps {
  match: Match;
  predictionSummary?: string | null;
  onPredict: (match: Match) => void;
  onClearPrediction?: (match: Match) => void;
  isLocked?: boolean;
  lockMessage?: string;
}

export function MatchCard({
  match,
  predictionSummary,
  onPredict,
  onClearPrediction,
  isLocked = false,
  lockMessage
}: MatchCardProps) {
  const hasPrediction = Boolean(predictionSummary);

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

              <MatchVs match={match} />

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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
              {hasPrediction && !isLocked && onClearPrediction ? (
                <Button
                  color='error'
                  variant='outlined'
                  onClick={() => onClearPrediction(match)}
                  sx={{ minWidth: 180 }}
                >
                  Limpiar pronóstico
                </Button>
              ) : null}

              <Button
                disabled={isLocked}
                variant={hasPrediction ? 'outlined' : 'contained'}
                onClick={() => onPredict(match)}
                sx={{ minWidth: 180 }}
              >
                {isLocked ? 'Pronóstico bloqueado' : hasPrediction ? 'Editar pronóstico' : 'Cargar pronóstico'}
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
