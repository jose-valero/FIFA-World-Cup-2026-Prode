import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import type { Match } from '../../matches/types/types';

interface PredictionDialogProps {
  open: boolean;
  match: Match | null;
  initialHomeScore?: number | null;
  initialAwayScore?: number | null;
  onClose: () => void;
  onSave: (payload: { matchId: string; homeScore: number; awayScore: number }) => void;
  onDelete?: (matchId: string) => void;
}

export function PredictionDialog({
  open,
  match,
  initialHomeScore = null,
  initialAwayScore = null,
  onClose,
  onSave,
  onDelete
}: PredictionDialogProps) {
  const [homeScore, setHomeScore] = React.useState('');
  const [awayScore, setAwayScore] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

  const hasExistingPrediction = initialHomeScore !== null && initialAwayScore !== null;

  React.useEffect(() => {
    if (!open) return;

    setHomeScore(initialHomeScore !== null ? String(initialHomeScore) : '');
    setAwayScore(initialAwayScore !== null ? String(initialAwayScore) : '');
    setErrorMessage('');
  }, [open, initialHomeScore, initialAwayScore]);

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

    onSave({
      matchId: match.id,
      homeScore: parsedHomeScore,
      awayScore: parsedAwayScore
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{hasExistingPrediction ? 'Editar pronóstico' : 'Cargar pronóstico'}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={0.5}>
            <Typography fontWeight={700}>
              {match?.homeTeam} vs {match?.awayTeam}
            </Typography>

            <Typography variant='body2' color='text.secondary'>
              {match?.kickoff}
            </Typography>
          </Stack>

          <Stack direction='row' spacing={2}>
            <TextField
              label={match?.homeTeam ?? 'Local'}
              type='number'
              fullWidth
              value={homeScore}
              onChange={(event) => setHomeScore(event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />

            <TextField
              label={match?.awayTeam ?? 'Visitante'}
              type='number'
              fullWidth
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />
          </Stack>

          {errorMessage ? (
            <Typography variant='body2' color='error'>
              {errorMessage}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
        <Stack direction='row' spacing={1}>
          {hasExistingPrediction && onDelete ? (
            <Button onClick={handleDelete} color='error' variant='outlined'>
              Limpiar pronóstico
            </Button>
          ) : null}
        </Stack>

        <Stack direction='row' spacing={1}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} variant='contained'>
            Guardar pronóstico
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
