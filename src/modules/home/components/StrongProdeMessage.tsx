import { Stack, Typography, Grid, Card, CardContent, Divider } from '@mui/material';

export const StrongProdeMessage = () => {
  return (
    <Grid size={{ xs: 12, md: 5 }}>
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
          <Stack spacing={2}>
            <Typography variant='h5' fontWeight={800}>
              Lo que hace fuerte esta quiniela
            </Typography>

            <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
              No es solo cargar resultados: es seguir el torneo, medir tu rendimiento, compararte con los demás y
              mantener la competencia viva durante todo el Mundial.
            </Typography>

            <Divider />

            <Stack spacing={1.25}>
              <Typography variant='body2' color='text.secondary'>
                ✔ Fixture completo y fase de eliminación
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                ✔ Ranking global actualizado con resultados oficiales
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                ✔ Auditorias para ver los resultados y transparencia
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                ✔ Vista clara de tus pronósticos y rendimiento
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                ✔ Ideal para sumar más amigos y competir en serio
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};
