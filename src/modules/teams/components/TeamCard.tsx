import { Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router';
import { routes } from '../../../app/router/routes';
import type { TeamCatalogItem } from '../types/teams.types';
import { TeamFlag } from '../../../shared/components/TeamFlag';

type TeamCardProps = {
  team: TeamCatalogItem;
};

export function TeamCard({ team }: TeamCardProps) {
  return (
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
        <Stack spacing={2} direction={'row'} justifyContent={'space-between'}>
          <Stack spacing={1.25} direction={'row'} alignItems={'center'}>
            <TeamFlag teamCode={team.code} teamName={team.name} />
            <Typography variant='h6' fontWeight={800}>
              {team.name}
            </Typography>
          </Stack>
          <Stack direction='row' justifyContent='flex-end'>
            <Button component={RouterLink} to={routes.teamDetail(team.id)} variant='outlined'>
              Ver detalle
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
