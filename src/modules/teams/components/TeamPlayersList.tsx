import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Alert, Avatar, Card, CardActionArea, CardContent, Stack, Typography } from '@mui/material';
import type { TeamPlayer } from '../types/teams.types';

type TeamPlayersListProps = {
  players: TeamPlayer[];
  onSelectPlayer: (player: TeamPlayer) => void;
};

type PlayerGroup = {
  title: string;
  items: TeamPlayer[];
};

function getPlayerGroupTitle(position?: string | null) {
  const normalized = (position ?? '').trim().toLowerCase();

  if (normalized.includes('goal')) return 'Arqueros';
  if (normalized.includes('defend')) return 'Defensores';
  if (normalized.includes('mid')) return 'Mediocampistas';
  if (normalized.includes('attack') || normalized.includes('forward') || normalized.includes('striker')) {
    return 'Delanteros';
  }

  return 'Otros';
}

function groupPlayers(players: TeamPlayer[]): PlayerGroup[] {
  const orderedTitles = ['Arqueros', 'Defensores', 'Mediocampistas', 'Delanteros', 'Otros'];
  const groupsMap = new Map<string, TeamPlayer[]>();

  for (const player of players) {
    const title = getPlayerGroupTitle(player.position);

    if (!groupsMap.has(title)) {
      groupsMap.set(title, []);
    }

    groupsMap.get(title)!.push(player);
  }

  return orderedTitles
    .filter((title) => (groupsMap.get(title)?.length ?? 0) > 0)
    .map((title) => ({
      title,
      items: (groupsMap.get(title) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
    }));
}

export function TeamPlayersList({ players, onSelectPlayer }: TeamPlayersListProps) {
  if (players.length === 0) {
    return <Alert severity='info'>Este equipo todavía no tiene jugadores sincronizados.</Alert>;
  }

  const groups = groupPlayers(players);

  return (
    <Stack spacing={3}>
      {groups.map((group) => (
        <Stack key={group.title} spacing={1.25}>
          <Typography variant='h6' fontWeight={800}>
            {group.title}
          </Typography>

          <Stack spacing={1}>
            {group.items.map((player) => (
              <Card
                key={player.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden'
                }}
              >
                <CardActionArea onClick={() => onSelectPlayer(player)}>
                  <CardContent sx={{ px: 2, py: 1.5 }}>
                    <Stack direction='row' alignItems='center' spacing={1.5}>
                      <Avatar
                        src={player.photoUrl ?? undefined}
                        alt={player.name}
                        sx={{ width: 40, height: 40, flexShrink: 0 }}
                      >
                        {player.name.charAt(0)}
                      </Avatar>

                      <Typography fontWeight={700} sx={{ flex: 1, minWidth: 0 }}>
                        {player.name}
                      </Typography>

                      <ChevronRightRoundedIcon color='action' />
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
