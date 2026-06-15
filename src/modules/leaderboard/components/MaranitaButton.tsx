import { Box, IconButton, Typography } from '@mui/material';

interface MaranitaButtonProps {
  total: number;
  myCount: number;
  isCurrentUser: boolean;
  isPending: boolean;
  onClick: () => void;
}

export function MaranitaButton({ total, myCount, isCurrentUser, isPending, onClick }: MaranitaButtonProps) {
  const atLimit = myCount >= 25;
  const disabled = isCurrentUser || atLimit || isPending;
  const showBadge = total > 0;

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
      <IconButton
        size='small'
        disabled={disabled}
        onClick={onClick}
        aria-label={isCurrentUser ? 'Tus marañitas' : 'Dar marañita'}
        sx={{
          width: 26,
          height: 26,
          color: atLimit ? 'warning.main' : 'text.secondary',
          opacity: isCurrentUser ? 0.45 : 1
        }}
      >
        <Typography sx={{ fontSize: 11, lineHeight: 1, userSelect: 'none' }}>🕯️</Typography>
      </IconButton>

      {showBadge ? (
        <Box
          sx={{
            position: 'absolute',
            top: -4,
            right: -6,
            minWidth: 14,
            height: 14,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 0.25,
            bgcolor: atLimit ? 'warning.main' : 'purple',
            color: '#fff',
            fontSize: '0.55rem',
            fontWeight: 700,
            lineHeight: 1,
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {total}
        </Box>
      ) : null}
    </Box>
  );
}
