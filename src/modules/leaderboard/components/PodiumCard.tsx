import { Card, CardContent, Stack, Typography, Chip, Avatar, Box } from '@mui/material';
import type { LeaderboardRow } from '../types/leaderboard.types';
import { getInitial } from '../../../shared/utils/getInitial';
import { podiumStyle as _podiumStyle } from '../styles/atoms';
import { podiumLabel as _podiumLabel } from '../utils/podiumLabel';

export function PodiumCard({
  row,
  position,
  isCurrentUser,
  avatarUrl
}: {
  row: LeaderboardRow;
  position: number;
  isCurrentUser: boolean;
  avatarUrl?: string | null;
}) {
  const podiumStyle = _podiumStyle(position);
  const podiumLabel = _podiumLabel(position);

  if (!podiumStyle) return null;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 2,
        border: `1px solid ${podiumStyle.border}`,
        background: `linear-gradient(180deg, ${podiumStyle.bg} 0%, transparent 100%)`,
        boxShadow: `0 4px 16px 0 ${podiumStyle.border}28`
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1.5} alignItems='center'>
            <Avatar
              src={avatarUrl ?? undefined}
              sx={{
                width: 52,
                height: 52,
                fontSize: 20,
                fontWeight: 800,
                border: `2px solid ${podiumStyle.border}`,
                boxShadow: `0 0 0 3px ${podiumStyle.bg}`
              }}
            >
              {getInitial(row.display_name)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Typography
                  variant='h6'
                  fontWeight={800}
                  sx={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {row.display_name}
                </Typography>

                {podiumLabel ? (
                  <Chip
                    label={podiumLabel}
                    size='small'
                    sx={{
                      borderColor: podiumStyle.border,
                      color: podiumStyle.color,
                      fontWeight: 700
                    }}
                    variant='outlined'
                  />
                ) : null}
                {isCurrentUser ? <Chip label='Tú' size='small' variant='outlined' /> : null}
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Posición #{position}
              </Typography>
            </Box>
          </Stack>

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip
              label={`${row.total_points} pts`}
              size='small'
              variant='outlined'
              sx={{ borderColor: podiumStyle.border, color: podiumStyle.color, fontWeight: 700 }}
            />
            <Chip label={`${row.exact_hits} exactos`} size='small' variant='outlined' />
            <Chip label={`${row.outcome_hits} signo`} size='small' variant='outlined' />
          </Stack>

          <Typography variant='body2' color='text.secondary'>
            Partidos evaluados: {row.scored_predictions}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
