import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Button, Card, CardContent, Stack, Typography, alpha } from '@mui/material';
import { performRecoveryReload } from '../utils/chunkErrors';

interface Props {
  alreadyRetried?: boolean;
}

export function AppUpdateScreen({ alreadyRetried = false }: Props) {
  function handleReload() {
    sessionStorage.clear();
    window.location.replace(
      window.location.pathname + window.location.search + window.location.hash
    );
  }

  function handleGoHome() {
    sessionStorage.clear();
    window.location.replace('/');
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
      }}
    >
      <Card
        elevation={0}
        sx={(theme) => ({
          width: '100%',
          maxWidth: 520,
          borderRadius: 4,
          border: '1px solid',
          borderColor: alpha(theme.palette.common.white, 0.08),
          background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.96)} 0%, ${alpha(theme.palette.background.default, 0.98)} 100%)`,
          boxShadow: `0 24px 60px ${alpha(theme.palette.common.black, 0.2)}`,
        })}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3} alignItems='center' textAlign='center'>
            {/* Icon */}
            <Box
              sx={(theme) => ({
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.20)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 60%, transparent 100%)`,
              })}
            >
              <RefreshRoundedIcon sx={{ fontSize: 38, color: 'primary.main' }} />
            </Box>

            {/* Copy */}
            <Stack spacing={1.5} alignItems='center'>
              <Typography
                variant='h5'
                sx={{ fontWeight: 900, lineHeight: 1.2, fontSize: { xs: '1.4rem', sm: '1.7rem' } }}
              >
                {alreadyRetried ? 'Algo no está funcionando' : 'La quiniela se actualizó'}
              </Typography>

              <Typography variant='body1' color='text.secondary' sx={{ maxWidth: 400, lineHeight: 1.6 }}>
                {alreadyRetried
                  ? 'Tu navegador sigue con una versión vieja. Intentá recargar manualmente o volver al inicio.'
                  : 'Tu navegador tenía guardada una versión anterior. Recargá la página y quedás al día.'}
              </Typography>
            </Stack>

            {/* Actions */}
            <Stack spacing={1.5} sx={{ width: '100%', pt: 0.5 }}>
              <Button
                variant='contained'
                size='large'
                onClick={handleReload}
                startIcon={<RefreshRoundedIcon />}
                sx={{ borderRadius: 999, fontWeight: 700 }}
                fullWidth
              >
                Recargar ahora
              </Button>
              <Button
                variant='outlined'
                size='large'
                onClick={handleGoHome}
                startIcon={<HomeRoundedIcon />}
                sx={{ borderRadius: 999 }}
                fullWidth
              >
                Ir al inicio
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

// Re-export for ChunkErrorBoundary usage
export { performRecoveryReload };
