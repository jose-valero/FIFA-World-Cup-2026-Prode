import { Stack, Typography } from '@mui/material';
import { TeamFlag } from './TeamFlag';
import type { Match } from '../../modules/matches/types/types';

type MatchVsProps = {
  match: Match | null;
};

export const MatchVs = ({ match }: MatchVsProps) => {
  return (
    <Stack direction='row' spacing={1.25} alignItems='center'>
      <Stack direction='row' spacing={0.5} alignItems='center'>
        <TeamFlag teamCode={match?.homeTeamCode} teamName={match?.homeTeam} />
        <Typography variant='h6' fontWeight={700}>
          {match?.homeTeam}
        </Typography>
      </Stack>

      <Typography color='text.secondary' fontWeight={700}>
        vs
      </Typography>

      <Stack direction='row' spacing={0.5} alignItems='center'>
        <TeamFlag teamCode={match?.awayTeamCode} teamName={match?.awayTeam} />
        <Typography variant='h6' fontWeight={700}>
          {match?.awayTeam}
        </Typography>
      </Stack>
    </Stack>
  );
};
