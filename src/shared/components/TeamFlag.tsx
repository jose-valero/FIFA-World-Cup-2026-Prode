import { Avatar, Box } from '@mui/material';
import { getFlagSrcByTeamCode } from '../utils/flagMap';

type TeamFlagProps = {
  teamCode?: string | null;
  teamName?: string | null;
  size?: number;
  rounded?: boolean;
};

export function TeamFlag({ teamCode, teamName, size = 16, rounded = false }: TeamFlagProps) {
  const flagSrc = getFlagSrcByTeamCode(teamCode);
  const effectiveSize = Math.max(16, Math.round(size));

  if (!flagSrc) {
    return (
      <Avatar
        variant={rounded ? 'circular' : 'rounded'}
        sx={{
          width: effectiveSize,
          height: effectiveSize,
          fontSize: Math.max(10, effectiveSize * 0.42),
          fontWeight: 800,
          borderRadius: rounded ? effectiveSize / 2 : '4px'
        }}
      >
        {teamCode?.slice(0, 2).toUpperCase() ?? '?'}
      </Avatar>
    );
  }

  const flagWidth = Math.round(effectiveSize * 1.4);
  const flagHeight = effectiveSize;

  return (
    <Box
      component='img'
      src={flagSrc}
      alt={teamName ? `Bandera de ${teamName}` : `Bandera ${teamCode ?? ''}`}
      sx={{
        width: flagWidth,
        height: flagHeight,
        objectFit: 'contain',
        borderRadius: rounded ? '999px' : '3px',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
        display: 'block',
        flexShrink: 0
      }}
    />
  );
}
