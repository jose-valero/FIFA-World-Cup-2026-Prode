import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  getAdminMatches,
  syncQualifiedTeamsIntoKnockout,
  updateOfficialResult,
  type AdminMatchRow,
  type AdminMatchStatus
} from '../features/admin/adminResults.api';

type DraftMap = Record<
  string,
  {
    status: AdminMatchStatus;
    officialHomeScore: string;
    officialAwayScore: string;
  }
>;

function formatKickoff(isoDate: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}

function buildInitialDrafts(matches: AdminMatchRow[]): DraftMap {
  return matches.reduce<DraftMap>((acc, match) => {
    acc[match.id] = {
      status: match.status,
      officialHomeScore: match.official_home_score !== null ? String(match.official_home_score) : '',
      officialAwayScore: match.official_away_score !== null ? String(match.official_away_score) : ''
    };
    return acc;
  }, {});
}

function validateOfficialResultDraft(input: {
  status: AdminMatchStatus;
  officialHomeScore: number | null;
  officialAwayScore: number | null;
}): string | null {
  const { status, officialHomeScore, officialAwayScore } = input;

  const hasHome = officialHomeScore !== null;
  const hasAway = officialAwayScore !== null;

  if (hasHome !== hasAway) {
    return 'Debes completar ambos marcadores o dejar ambos vacíos.';
  }

  if (
    (officialHomeScore !== null && (!Number.isInteger(officialHomeScore) || officialHomeScore < 0)) ||
    (officialAwayScore !== null && (!Number.isInteger(officialAwayScore) || officialAwayScore < 0))
  ) {
    return 'Los resultados deben ser números enteros válidos mayores o iguales a 0.';
  }

  if (status === 'scheduled' && (hasHome || hasAway)) {
    return 'Un partido pendiente no debe tener marcador oficial.';
  }

  if (status === 'finished' && (!hasHome || !hasAway)) {
    return 'Un partido finalizado debe tener ambos marcadores cargados.';
  }

  return null;
}

export function AdminResultsPage() {
  const [matches, setMatches] = React.useState<AdminMatchRow[]>([]);
  const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [open, setOpen] = React.useState<boolean>(false);

  const [isSyncingKnockout, setIsSyncingKnockout] = React.useState(false);

  const handleClose = (): void => {
    setOpen(false);
    //content
  };

  async function loadMatches() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getAdminMatches();
      setMatches(data);
      setDrafts(buildInitialDrafts(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los partidos';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }
  React.useEffect(() => {
    void loadMatches();
  }, []);

  const handleDraftChange = (
    matchId: string,
    field: 'status' | 'officialHomeScore' | 'officialAwayScore',
    value: string
  ) => {
    setDrafts((prev) => {
      const nextDraft = {
        ...prev[matchId],
        [field]: value
      };

      if (field === 'status' && value === 'scheduled') {
        nextDraft.officialHomeScore = '';
        nextDraft.officialAwayScore = '';
      }

      return {
        ...prev,
        [matchId]: nextDraft
      };
    });
  };

  const handleSave = async (matchId: string) => {
    const draft = drafts[matchId];
    if (!draft) return;

    setErrorMessage('');
    setSuccessMessage('');

    const parsedHome = draft.officialHomeScore.trim() === '' ? null : Number(draft.officialHomeScore);
    const parsedAway = draft.officialAwayScore.trim() === '' ? null : Number(draft.officialAwayScore);

    if ((parsedHome !== null && Number.isNaN(parsedHome)) || (parsedAway !== null && Number.isNaN(parsedAway))) {
      setErrorMessage('Los resultados deben ser números válidos.');
      return;
    }

    const validationError = validateOfficialResultDraft({
      status: draft.status,
      officialHomeScore: parsedHome,
      officialAwayScore: parsedAway
    });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      await updateOfficialResult({
        matchId,
        status: draft.status,
        officialHomeScore: parsedHome,
        officialAwayScore: parsedAway
      });
      // await syncQualifiedTeamsIntoKnockout();
      // // creo que no necesito esto en esta vista
      // await loadMatches();
      setOpen(true);
      setMatches((prev) =>
        prev.map((match) =>
          match.id === matchId
            ? {
                ...match,
                status: draft.status,
                official_home_score: parsedHome,
                official_away_score: parsedAway
              }
            : match
        )
      );

      setDrafts((prev) => ({
        ...prev,
        [matchId]: {
          status: draft.status,
          officialHomeScore: parsedHome !== null ? String(parsedHome) : '',
          officialAwayScore: parsedAway !== null ? String(parsedAway) : ''
        }
      }));

      setSuccessMessage('Resultado guardado correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el resultado';
      setErrorMessage(message);
    }
  };

  const handleSyncKnockout = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSyncingKnockout(true);

    try {
      await syncQualifiedTeamsIntoKnockout();
      await loadMatches();
      setSuccessMessage('Knockout sincronizado correctamente.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo sincronizar el knockout';
      setErrorMessage(message);
    } finally {
      setIsSyncingKnockout(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1}>
            <Typography variant='h4' fontWeight={800}>
              Admin · Resultados oficiales
            </Typography>
            <Typography color='text.secondary'>Aquí puedes editar los marcadores oficiales.</Typography>
          </Stack>
        </CardContent>
      </Card>

      <Button variant='outlined' onClick={() => void handleSyncKnockout()} disabled={isSyncingKnockout}>
        {isSyncingKnockout ? 'Sincronizando...' : 'Re-sincronizar knockout'}
      </Button>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
      {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Stack spacing={2}>
          {matches.map((match) => {
            const draft = drafts[match.id];

            return (
              <Card key={match.id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant='h6' fontWeight={800}>
                        {match.home_team} vs {match.away_team}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {match.group_name} · {formatKickoff(match.kickoff_at)}
                      </Typography>
                    </Box>

                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                      <TextField
                        select
                        label='Estado'
                        value={draft?.status ?? 'scheduled'}
                        onChange={(event) => handleDraftChange(match.id, 'status', event.target.value)}
                        sx={{ minWidth: 180 }}
                      >
                        <MenuItem value='scheduled'>Pendiente</MenuItem>
                        <MenuItem value='live'>En vivo</MenuItem>
                        <MenuItem value='finished'>Finalizado</MenuItem>
                      </TextField>

                      <TextField
                        label={match.home_team}
                        type='number'
                        value={draft?.officialHomeScore ?? ''}
                        onChange={(event) => handleDraftChange(match.id, 'officialHomeScore', event.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ maxWidth: 180 }}
                      />

                      <TextField
                        label={match.away_team}
                        type='number'
                        value={draft?.officialAwayScore ?? ''}
                        onChange={(event) => handleDraftChange(match.id, 'officialAwayScore', event.target.value)}
                        inputProps={{ min: 0 }}
                        sx={{ maxWidth: 180 }}
                      />

                      <Button variant='contained' onClick={() => void handleSave(match.id)}>
                        Guardar
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity='success' variant='filled' sx={{ width: '100%' }}>
          Resultado guardado correctamente
        </Alert>
      </Snackbar>
    </Stack>
  );
}
