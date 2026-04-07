import { LinearProgress, Stack, Typography } from '@mui/material';

interface ProgressBlock {
  label: string;
  valueLabel: string;
  progress: number;
}

export function ProgressBlock({ label, valueLabel, progress }: ProgressBlock) {
  return (
    <Stack spacing={0.75}>
      <Stack direction='row' justifyContent='space-between' spacing={1}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>

        <Typography variant='body2' fontWeight={700}>
          {valueLabel}
        </Typography>
      </Stack>

      <LinearProgress
        variant='determinate'
        value={Math.max(0, Math.min(progress, 100))}
        sx={{
          height: 10,
          borderRadius: 999
        }}
      />
    </Stack>
  );
}
