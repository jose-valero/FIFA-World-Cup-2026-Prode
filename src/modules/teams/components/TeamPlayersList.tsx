import { Alert, Avatar, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { TeamPlayer } from '../types/teams.types';

type TeamPlayersListProps = {
  players: TeamPlayer[];
};

export function TeamPlayersList({ players }: TeamPlayersListProps) {
  if (players.length === 0) {
    return <Alert severity='info'>Este equipo todavía no tiene jugadores sincronizados.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {players.map((player) => (
        <Card
          key={player.id}
          elevation={0}
          sx={{
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Avatar src={player.photoUrl ?? undefined} alt={player.name} sx={{ width: 52, height: 52 }} />

              <Stack spacing={0.75} sx={{ flex: 1 }}>
                <Typography fontWeight={800}>{player.name}</Typography>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                  {player.position ? <Chip size='small' label={player.position} variant='outlined' /> : null}
                  {player.number ? <Chip size='small' label={`#${player.number}`} variant='outlined' /> : null}
                  {player.age ? <Chip size='small' label={`${player.age} años`} variant='outlined' /> : null}
                </Stack>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
