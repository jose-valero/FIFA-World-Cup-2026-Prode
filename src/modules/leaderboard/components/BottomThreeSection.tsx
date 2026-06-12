import { alpha, Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import type { LeaderboardRow } from '../types/leaderboard.types';
import { getInitial } from '../../../shared/utils/getInitial';
import AssistWalkerIcon from '@mui/icons-material/AssistWalker';
type Props = {
  rows: LeaderboardRow[];
  positionMap: Map<string, number>;
  avatarMap: Map<string, string>;
  currentUserId: string | undefined;
};

export function BottomThreeSection({ rows, positionMap, avatarMap, currentUserId }: Props) {
  if (rows.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Stack direction='row' spacing={0.75} alignItems='center'>
        <AssistWalkerIcon sx={{ fontSize: 24, color: 'text.disabled' }} />
        <Typography
          variant='overline'
          sx={{ color: 'text.disabled', letterSpacing: 1.2, lineHeight: 1.5, fontSize: '0.65rem' }}
        >
          Detrás de la ambulancia
        </Typography>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        <Stack direction='row' spacing={1} sx={{ minWidth: 0 }}>
          {rows.map((row) => {
            const position = positionMap.get(row.user_id);
            const avatarUrl = avatarMap.get(row.user_id);
            const isCurrentUser = row.user_id === currentUserId;

            return (
              <Box key={row.user_id} sx={{ flex: '1 1 0%', minWidth: 100 }}>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: (t) => alpha(t.palette.error.dark, 0.5),
                    bgcolor: (t) => alpha(t.palette.error.dark, 0.15)
                  }}
                >
                  <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                    <Stack direction='row' spacing={1} alignItems='center'>
                      <Avatar
                        src={avatarUrl ?? undefined}
                        sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 800, flexShrink: 0 }}
                      >
                        {getInitial(row.display_name)}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.3 }}>
                          {row.display_name}
                          {isCurrentUser ? ' · Tú' : ''}
                        </Typography>
                        <Typography variant='caption' sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {position != null ? `#${position}` : '—'}
                          {' · '}
                          {row.total_points} pts
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
