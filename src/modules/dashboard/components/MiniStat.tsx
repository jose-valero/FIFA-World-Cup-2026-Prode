import { Box, Stack, Typography } from '@mui/material';

interface MiniStatProps {
  label: string;
  value: string | number;
}

export function MiniStat({ label, value }: MiniStatProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={0.5}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='h5' fontWeight={800}>
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}
