import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { scoringRules } from '../info/scoringRules';
export const ScoringRules = () => {
  return (
    <Box>
      <Typography variant='h4' fontWeight={800} gutterBottom>
        Sistema de puntos
      </Typography>

      <Grid container spacing={2}>
        {scoringRules.map((rule) => (
          <Grid key={rule.title} size={{ xs: 12, md: 4 }}>
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
                  <Stack spacing={0.5}>
                    <Typography variant='h6' fontWeight={700}>
                      {rule.title}
                    </Typography>

                    <Typography variant='h4' color='primary' sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
                      {rule.points}
                    </Typography>
                  </Stack>

                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
                    {rule.description}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
