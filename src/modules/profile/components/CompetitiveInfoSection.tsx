import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';

type CompetitiveInfoSectionProps = {
  isLoading: boolean;
  isError: boolean;
  isDisabled: boolean;
  rank: number | null;
  totalPoints: number;
  exactHits: number;
  outcomeHits: number;
  scoredPredictions: number;
};

type StatBoxProps = {
  label: string;
  value: string | number;
  highlight?: boolean;
};

function StatBox({ label, value, highlight }: StatBoxProps) {
  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        minWidth: 100,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: highlight ? theme.palette.primary.main : theme.palette.divider,
        bgcolor: highlight ? `${theme.palette.primary.main}0A` : undefined,
        textAlign: 'center'
      })}
    >
      <Typography variant='h5' fontWeight={800} color={highlight ? 'primary.main' : 'text.primary'}>
        {value}
      </Typography>
      <Typography variant='caption' color='text.secondary'>
        {label}
      </Typography>
    </Box>
  );
}

export function CompetitiveInfoSection({
  isLoading,
  isError,
  isDisabled,
  rank,
  totalPoints,
  exactHits,
  outcomeHits,
  scoredPredictions
}: CompetitiveInfoSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant='subtitle1' fontWeight={800}>
          Información competitiva
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Tu posición y métricas en el torneo.
        </Typography>
      </Stack>

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 3 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : isError ? (
        <Alert severity='error'>No se pudieron cargar los datos competitivos.</Alert>
      ) : (
        <Stack spacing={2.5}>
          <Stack direction='row' spacing={1.5} alignItems='center' flexWrap='wrap' useFlexGap>
            {isDisabled ? (
              <Chip label='Fuera de competencia' color='default' variant='outlined' />
            ) : rank !== null ? (
              <Chip label={`Posición #${rank}`} color='primary' />
            ) : (
              <Chip label='Sin posición' color='default' variant='outlined' />
            )}
          </Stack>

          <Stack direction='row' spacing={1.5} flexWrap='wrap' useFlexGap>
            <StatBox label='Puntos' value={totalPoints} highlight />
            <StatBox label='Exactos' value={exactHits} />
            <StatBox label='Aciertos de signo' value={outcomeHits} />
            <StatBox label='Partidos evaluados' value={scoredPredictions} />
          </Stack>
        </Stack>
      )}
    </Paper>
  );
}
