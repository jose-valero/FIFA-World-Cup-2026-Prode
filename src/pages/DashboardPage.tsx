import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

// function getDisplayName(user: any) {
//   const metadataName = user?.user_metadata?.display_name || user?.user_metadata?.displayName;

//   if (metadataName && typeof metadataName === 'string') {
//     return metadataName;
//   }

//   if (user?.email && typeof user.email === 'string') {
//     return user.email.split('@')[0];
//   }

//   return 'Usuario';
// }

const quickStats = [
  { label: 'Pronósticos cargados', value: '0' },
  { label: 'Puntos actuales', value: '0' },
  { label: 'Posición global', value: '-' }
];

export function DashboardPage() {
  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        {quickStats.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1}>
                  <Typography variant='body2' color='text.secondary'>
                    {item.label}
                  </Typography>

                  <Typography variant='h4' fontWeight={800}>
                    {item.value}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
