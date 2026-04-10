import { Card, CardContent, Stack, Typography } from '@mui/material';

export function StatCard({ label, value, helper }: { label: string; value: string | number; helper?: string }) {
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
        <Stack spacing={1}>
          <Typography variant='body2' color='text.secondary'>
            {label}
          </Typography>

          <Typography variant='h4' fontWeight={800}>
            {value}
          </Typography>

          {helper ? (
            <Typography variant='caption' color='text.secondary'>
              {helper}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
