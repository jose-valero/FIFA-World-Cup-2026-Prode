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

  const flagWidth = Math.round(size * 1.4);
  const flagHeight = Math.round(size);

  return (
    <Box
      component='img'
      src={flagSrc}
      alt={teamName ? `Bandera de ${teamName}` : `Bandera ${teamCode ?? ''}`}
      sx={{
        width: flagWidth,
        height: flagHeight,
        objectFit: 'contain',
        borderRadius: rounded ? '999px' : '4px',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}
