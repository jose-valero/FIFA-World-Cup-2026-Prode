import { alpha, Box, Stack, Typography } from '@mui/material';

interface ComparisonRowProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
}

export function ComparisonRow({ label, value, maxValue, color = 'primary.main' }: ComparisonRowProps) {
  const ratio = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <Stack spacing={0.5}>
      <Stack direction='row' justifyContent='space-between' spacing={1}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='body2' fontWeight={700}>
          {value}
        </Typography>
      </Stack>

      <Box
        sx={(theme) => ({
          height: 10,
          width: '100%',
          borderRadius: 999,
          bgcolor: alpha(theme.palette.common.white, 0.08),
          overflow: 'hidden'
        })}
      >
        <Box
          sx={{
            height: '100%',
            width: `${Math.max(0, Math.min(ratio, 100))}%`,
            borderRadius: 999,
            bgcolor: color
          }}
        />
      </Box>
    </Stack>
  );
}
