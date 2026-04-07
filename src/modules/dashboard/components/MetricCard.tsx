import { Card, CardContent, Stack, Typography } from '@mui/material';

interface MetricCardProps {
  label: string;
  value: string | number;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
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
      <CardContent sx={{ p: 2.5 }}>
        <Stack spacing={0.75}>
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
