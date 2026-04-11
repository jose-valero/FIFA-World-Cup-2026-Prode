import { Card, CardContent, Grid, Stack, Typography, alpha, Chip, Button, Box, Alert } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import type { LeaderboardRow } from '../../leaderboard/types/leaderboard.types';
interface LeaderboardPreviewProps {
  leaderboardPreview: LeaderboardRow[];
}

export const LeaderboardPreview = ({ leaderboardPreview }: LeaderboardPreviewProps) => {
  return (
    <Grid size={{ xs: 12, md: 7 }}>
      <Card
        elevation={0}
        sx={{
          height: '100%',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack direction='row' alignItems='center' justifyContent='space-between' spacing={2}>
              <Typography variant='h5' fontWeight={800}>
                Ranking preview
              </Typography>

              <Button
                component={RouterLink}
                to='/leaderboard'
                variant='text'
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Ver tabla completa
              </Button>
            </Stack>

            {leaderboardPreview.length === 0 ? (
              <Alert severity='info'>Todavía no hay suficientes datos para mostrar el ranking.</Alert>
            ) : (
              <Stack spacing={1.25}>
                {leaderboardPreview.map((player, index) => (
                  <Box
                    key={player.user_id}
                    sx={(theme) => ({
                      display: 'grid',
                      gridTemplateColumns: '56px 1fr auto',
                      gap: 2,
                      alignItems: 'center',
                      px: 2,
                      py: 1.5,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: index === 0 ? alpha(theme.palette.primary.main, 0.4) : 'divider',
                      background: index === 0 ? alpha(theme.palette.primary.main, 0.08) : undefined
                    })}
                  >
                    <Typography fontWeight={900}>#{index + 1}</Typography>

                    <Typography
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {player.display_name}
                    </Typography>

                    <Chip
                      label={`${player.total_points} pts`}
                      color={index === 0 ? 'primary' : 'default'}
                      variant={index === 0 ? 'filled' : 'outlined'}
                      size='small'
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};
