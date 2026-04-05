import * as React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from '@mui/material';
import type { Match } from '../types';

interface PredictionDialogProps {
  open: boolean;
  match: Match | null;
  initialHomeScore?: number | null;
  initialAwayScore?: number | null;
  onClose: () => void;
  onSave: (payload: { matchId: string; homeScore: number; awayScore: number }) => void;
}

export function PredictionDialog({
  open,
  match,
  initialHomeScore = null,
  initialAwayScore = null,
  onClose,
  onSave
}: PredictionDialogProps) {
  const [homeScore, setHomeScore] = React.useState('');
  const [awayScore, setAwayScore] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');

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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Cargar pronóstico</DialogTitle>

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
              // inputProps={{ min: 0, step: 1 }}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />

            <TextField
              label={match?.awayTeam ?? 'Visitante'}
              type='number'
              fullWidth
              value={awayScore}
              onChange={(event) => setAwayScore(event.target.value)}
              // inputProps={{ min: 0, step: 1 }}
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant='contained'>
          Guardar pronóstico
        </Button>
      </DialogActions>
    </Dialog>
  );
}
