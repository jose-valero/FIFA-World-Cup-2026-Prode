import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { howItWorks } from '../info/howitworks';

export const HowItWorks = () => {
  return (
    <Box>
      <Typography variant='h4' fontWeight={800} gutterBottom>
        ¿Cómo funciona?
      </Typography>
      <Grid container spacing={2}>
        {howItWorks.map((item) => (
          <Grid key={item.title} size={{ xs: 12, md: 4 }}>
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
                <Stack spacing={1.5}>
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <Box sx={{ display: 'inline-flex', color: 'primary.main' }}>{item.icon}</Box>
                    <Typography variant='h6' fontWeight={700}>
                      {item.title}
                    </Typography>
                  </Stack>

                  <Typography variant='body2' color='text.secondary' sx={{ lineHeight: 1.75 }}>
                    {item.description}
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
