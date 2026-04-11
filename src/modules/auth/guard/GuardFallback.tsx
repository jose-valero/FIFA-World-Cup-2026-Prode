import { CircularProgress, Stack } from '@mui/material';

export function GuardFallback() {
  return (
    <Stack alignItems='center' justifyContent='center' sx={{ minHeight: '50vh' }}>
      <CircularProgress />
    </Stack>
  );
}
