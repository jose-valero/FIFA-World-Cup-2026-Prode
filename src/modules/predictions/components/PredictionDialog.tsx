import * as React from 'react';
import {
  Alert,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import type { Match } from '../../matches/types/types';
import type { KnockoutTiebreak, KnockoutWinner } from '../types/predictions.types';

export type PredictionSavePayload = {
  matchId: string;
  homeScore: number;
  awayScore: number;
  knockoutTiebreak: KnockoutTiebreak | null;
  knockoutWinner: KnockoutWinner | null;
};

interface PredictionDialogProps {
  open: boolean;
  match: Match | null;
  initialHomeScore?: number | null;
  initialAwayScore?: number | null;
  initialKnockoutTiebreak?: KnockoutTiebreak | null;
  initialKnockoutWinner?: KnockoutWinner | null;
  /** Modo previsualización para admin: el cruce no está definido, el guardado está bloqueado. */
  isPreviewOnly?: boolean;
  onClose: () => void;
  onSave: (payload: PredictionSavePayload) => void;
  onDelete?: (matchId: string) => void;
}

export function PredictionDialog({
  open,
  match,
  initialHomeScore = null,
  initialAwayScore = null,
  initialKnockoutTiebreak = null,
  initialKnockoutWinner = null,
  isPreviewOnly = false,
  onClose,
  onSave,
  onDelete
}: PredictionDialogProps) {
  const [homeScore, setHomeScore] = React.useState('');
  const [awayScore, setAwayScore] = React.useState('');
  const [knockoutTiebreak, setKnockoutTiebreak] = React.useState<KnockoutTiebreak | null>(null);
  const [knockoutWinner, setKnockoutWinner] = React.useState<KnockoutWinner | null>(null);
  const [errorMessage, setErrorMessage] = React.useState('');

  const hasExistingPrediction = initialHomeScore !== null && initialAwayScore !== null;
  const isKnockout = match !== null && match.stage !== 'group_stage';

  const parsedHome = homeScore.trim() === '' ? null : Number(homeScore);
  const parsedAway = awayScore.trim() === '' ? null : Number(awayScore);
  const isDrawPrediction =
    parsedHome !== null &&
    parsedAway !== null &&
    !Number.isNaN(parsedHome) &&
    !Number.isNaN(parsedAway) &&
    parsedHome === parsedAway;

  const showKnockoutExtra = isKnockout && isDrawPrediction;

  React.useEffect(() => {
    if (!open) return;

    setHomeScore(initialHomeScore !== null ? String(initialHomeScore) : '');
    setAwayScore(initialAwayScore !== null ? String(initialAwayScore) : '');
    setKnockoutTiebreak(initialKnockoutTiebreak ?? null);
    setKnockoutWinner(initialKnockoutWinner ?? null);
    setErrorMessage('');
  }, [open, initialHomeScore, initialAwayScore, initialKnockoutTiebreak, initialKnockoutWinner]);

  // Clear knockout fields when user changes away from a draw
  React.useEffect(() => {
    if (!showKnockoutExtra) {
      setKnockoutTiebreak(null);
      setKnockoutWinner(null);
    }
  }, [showKnockoutExtra]);

  const handleSave = () => {
    if (!match) return;

    if (homeScore.trim() === '' || awayScore.trim() === '') {
      setErrorMessage('Debes completar ambos marcadores.');
      return;
    }

    const parsedHomeScore = Number(homeScore);
    const parsedAwayScore = Number(awayScore);

    const isInvalidScore =
      Number.isNaN(parsedHomeScore) ||
      Number.isNaN(parsedAwayScore) ||
      parsedHomeScore < 0 ||
      parsedAwayScore < 0 ||
      !Number.isInteger(parsedHomeScore) ||
      !Number.isInteger(parsedAwayScore);

    if (isInvalidScore) {
      setErrorMessage('Los marcadores deben ser números enteros válidos mayores o iguales a 0.');
      return;
    }

    const isDraw = parsedHomeScore === parsedAwayScore;

    if (isKnockout && isDraw) {
      if (!knockoutTiebreak) {
        setErrorMessage('Debes indicar cómo se define el ganador (prórroga o penales).');
        return;
      }
      if (!knockoutWinner) {
        setErrorMessage('Debes indicar qué equipo gana el cruce.');
        return;
      }
    }

    onSave({
      matchId: match.id,
      homeScore: parsedHomeScore,
      awayScore: parsedAwayScore,
      knockoutTiebreak: isKnockout && isDraw ? knockoutTiebreak : null,
      knockoutWinner: isKnockout && isDraw ? knockoutWinner : null
    });

    onClose();
  };

  const handleDelete = () => {
    if (!match || !onDelete) return;

    const confirmed = window.confirm('¿Seguro que quieres limpiar este pronóstico?');

    if (!confirmed) return;

    onDelete(match.id);
    onClose();
  };

  const homeTeam = match?.homeTeam ?? 'Local';
  const awayTeam = match?.awayTeam ?? 'Visitante';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{hasExistingPrediction ? 'Editar pronóstico' : 'Cargar pronóstico'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={0.5}>
            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
              <Typography fontWeight={700}>
                {homeTeam} vs {awayTeam}
              </Typography>
              {isKnockout ? (
                <Chip label='Eliminatoria' size='small' color='primary' variant='outlined' sx={{ fontSize: '0.65rem' }} />
              ) : null}
            </Stack>

            <Typography variant='body2' color='text.secondary'>
              {match?.kickoff}
            </Typography>
          </Stack>

          {isPreviewOnly ? (
            <Alert severity='warning' sx={{ py: 0.5 }}>
              Cruce sin equipos definidos — modo previsualización admin. El guardado está bloqueado.
            </Alert>
          ) : null}

          <Stack spacing={1}>
            <Typography variant='body2' color='text.secondary' fontWeight={600}>
              Resultado a los 90 minutos
            </Typography>

            <Stack direction='row' spacing={2}>
              <TextField
                label={homeTeam}
                type='number'
                fullWidth
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />

              <TextField
                label={awayTeam}
                type='number'
                fullWidth
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: 1 } }}
              />
            </Stack>
          </Stack>

          <Collapse in={showKnockoutExtra} unmountOnExit>
            <Stack spacing={2.5}>
              <Divider />

              <Stack spacing={0.5}>
                <Typography variant='body2' color='text.secondary'>
                  Empate en 90' → ¿cómo se define el ganador?
                </Typography>
                <Typography variant='caption' color='text.disabled'>
                  +2 pts si acertás el método · +1 pts extra si acertás el ganador
                </Typography>
              </Stack>

              <Stack spacing={1}>
                <Typography variant='body2' fontWeight={600}>
                  Método de definición
                </Typography>
                <ToggleButtonGroup
                  value={knockoutTiebreak}
                  exclusive
                  onChange={(_, value: KnockoutTiebreak | null) => {
                    if (value !== null) setKnockoutTiebreak(value);
                  }}
                  fullWidth
                  size='small'
                >
                  <ToggleButton value='extra_time' color='primary'>
                    Prórroga
                  </ToggleButton>
                  <ToggleButton value='penalties' color='primary'>
                    Penales
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>

              <Stack spacing={1}>
                <Typography variant='body2' fontWeight={600}>
                  Equipo que gana el cruce
                </Typography>
                <ToggleButtonGroup
                  value={knockoutWinner}
                  exclusive
                  onChange={(_, value: KnockoutWinner | null) => {
                    if (value !== null) setKnockoutWinner(value);
                  }}
                  fullWidth
                  size='small'
                >
                  <ToggleButton value='home' color='primary'>
                    {homeTeam}
                  </ToggleButton>
                  <ToggleButton value='away' color='primary'>
                    {awayTeam}
                  </ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Stack>
          </Collapse>

          {errorMessage ? (
            <Alert severity='error' sx={{ py: 0.5 }}>
              {errorMessage}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Stack direction='row' spacing={1}>
          {hasExistingPrediction && onDelete ? (
            <Button onClick={handleDelete} color='error' variant='outlined'>
              Limpiar
            </Button>
          ) : null}
        </Stack>

        <Stack direction='row' spacing={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} variant='contained'>
            Guardar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
