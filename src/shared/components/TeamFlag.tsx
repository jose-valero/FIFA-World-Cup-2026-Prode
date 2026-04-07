import { Avatar, Box } from '@mui/material';
import { getFlagSrcByTeamCode } from '../utils/flagMap';

type TeamFlagProps = {
  teamCode?: string | null;
  teamName?: string | null;
  size?: number;
  rounded?: boolean;
};

export function TeamFlag({ teamCode, teamName, size = 13, rounded = false }: TeamFlagProps) {
  const flagSrc = getFlagSrcByTeamCode(teamCode);

  if (!flagSrc) {
    return (
      <Avatar
        variant={rounded ? 'circular' : 'rounded'}
        sx={{
          width: size,
          height: size,
          fontSize: Math.max(10, size * 0.42),
          fontWeight: 800,
          borderRadius: rounded ? size / 2 : '4px'
        }}
      >
        {teamCode?.slice(0, 2).toUpperCase() ?? '?'}
      </Avatar>
    );
  }

  return (
    <Box
      component='img'
      src={flagSrc}
      alt={teamName ? `Bandera de ${teamName}` : `Bandera ${teamCode ?? ''}`}
      sx={{
        width: size * 1.4,
        height: size,
        objectFit: 'cover',
        borderRadius: rounded ? '999px' : '4px',
        // border: '1px solid',
        // borderColor: 'divider',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}
