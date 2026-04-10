import * as React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Chip
} from '@mui/material';
import { useAdminResults } from '../hooks/useAdminResults';
import { MatchVs } from '../../../../shared/components/MatchVs';
import { useUpdateOfficialResultMutation } from '../hooks/useAdminResultMutations';
import type { AdminMatchRow } from '../types/admin.results.types';
import { PageFiltersBar } from '../../../../shared/components/PageFiltersBar';
import type { MatchStatus } from '../../../matches/types/types';
import { formatKickoff } from '../../../../shared/utils/formatKickoff';

type DraftMap = Record<
  string,
  {
    status: MatchStatus;
    officialHomeScore: string;
    officialAwayScore: string;
  }
>;

type Filters = {
  stage: string;
  group: string;
  status: '' | MatchStatus;
  teamQuery: string;
};

const EMPTY_MATCHES: AdminMatchRow[] = [];

function mergeDraftsWithMatches(prev: DraftMap, matches: AdminMatchRow[]): DraftMap {
  const next = { ...prev };

  for (const match of matches) {
    next[match.id] = {
      status: match.status,
      officialHomeScore: match.official_home_score !== null ? String(match.official_home_score) : '',
      officialAwayScore: match.official_away_score !== null ? String(match.official_away_score) : ''
    };
  }

  return next;
}

function validateOfficialResultDraft(input: {
  status: MatchStatus;
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

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function getUniqueStageOptions(matches: AdminMatchRow[]) {
  return [...new Set(matches.map((match) => match.stage).filter(Boolean))].sort();
}

function getUniqueGroupOptions(matches: AdminMatchRow[]) {
  return [...new Set(matches.map((match) => match.group_name).filter(Boolean))].sort();
}

function matchTeamQuery(match: AdminMatchRow, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return true;

  const haystack = normalizeText(
    [match.home_team, match.away_team, match.home_team_code, match.away_team_code].filter(Boolean).join(' ')
  );

  return haystack.includes(normalizedQuery);
}

function hasDraftChanged(match: AdminMatchRow, draft: DraftMap[string] | undefined) {
  if (!draft) return false;

  const originalHome = match.official_home_score !== null ? String(match.official_home_score) : '';
  const originalAway = match.official_away_score !== null ? String(match.official_away_score) : '';

  return (
    draft.status !== match.status ||
    draft.officialHomeScore !== originalHome ||
    draft.officialAwayScore !== originalAway
  );
}

export function AdminResultsPage() {
  const adminResultsQuery = useAdminResults();
  const matchesData = adminResultsQuery.data;
  const matches = matchesData ?? EMPTY_MATCHES;

  const { isLoading, isError, error } = adminResultsQuery;

  const updateOfficialResultMutation = useUpdateOfficialResultMutation();

  const [drafts, setDrafts] = React.useState<DraftMap>({});
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [savingMatchId, setSavingMatchId] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState<Filters>({
    stage: '',
    group: '',
    status: '',
    teamQuery: ''
  });

  React.useEffect(() => {
    if (!matchesData) return;

    setDrafts((prev) => mergeDraftsWithMatches(prev, matchesData));
  }, [matchesData]);

  const stageOptions = React.useMemo(() => getUniqueStageOptions(matches), [matches]);
  const groupOptions = React.useMemo(() => getUniqueGroupOptions(matches), [matches]);

  const filteredMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const matchesStage = !filters.stage || match.stage === filters.stage;
      const matchesGroup = !filters.group || match.group_name === filters.group;
      const matchesStatus = !filters.status || match.status === filters.status;
      const matchesTeam = matchTeamQuery(match, filters.teamQuery);

      return matchesStage && matchesGroup && matchesStatus && matchesTeam;
    });
  }, [matches, filters]);

  const handleDraftChange = (
    matchId: string,
    field: 'status' | 'officialHomeScore' | 'officialAwayScore',
    value: string
  ) => {
    setDrafts((prev) => {
      const current = prev[matchId];

      if (!current) return prev;

      const nextDraft = {
        ...current,
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
      setSavingMatchId(matchId);

      const result = await updateOfficialResultMutation.mutateAsync({
        matchId,
        status: draft.status,
        officialHomeScore: parsedHome,
        officialAwayScore: parsedAway
      });

      setDrafts((prev) => ({
        ...prev,
        [matchId]: {
          status: draft.status,
          officialHomeScore: parsedHome !== null ? String(parsedHome) : '',
          officialAwayScore: parsedAway !== null ? String(parsedAway) : ''
        }
      }));

      if (result.syncWarning) {
        setErrorMessage(
          `Resultado guardado, pero el bracket no pudo sincronizarse: ${result.syncWarning}. Guardá cualquier resultado nuevamente para reintentarlo.`
        );
      } else {
        setSuccessMessage('Resultado guardado y cruces sincronizados correctamente.');
      }
    } catch (mutationError) {
      const message = mutationError instanceof Error ? mutationError.message : 'No se pudo actualizar el resultado';
      setErrorMessage(message);
    } finally {
      setSavingMatchId(null);
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
            <Typography color='text.secondary'>
              Aquí puedes editar los marcadores oficiales y filtrar rápidamente los partidos.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
      {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

      {isError ? (
        <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudieron cargar los partidos'}</Alert>
      ) : null}

      {/* <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}> */}
      <PageFiltersBar /* sx={{ p: 3 }} */>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              select
              label='Etapa'
              value={filters.stage}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  stage: event.target.value
                }))
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>Todas</MenuItem>
              {stageOptions.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label='Grupo'
              value={filters.group}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  group: event.target.value
                }))
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>Todos</MenuItem>
              {groupOptions.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label='Estado'
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as Filters['status']
                }))
              }
              sx={{ minWidth: 180 }}
            >
              <MenuItem value=''>Todos</MenuItem>
              <MenuItem value='scheduled'>Pendiente</MenuItem>
              <MenuItem value='live'>En vivo</MenuItem>
              <MenuItem value='finished'>Finalizado</MenuItem>
            </TextField>

            <TextField
              label='Equipo'
              placeholder='Buscar por país o código'
              value={filters.teamQuery}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  teamQuery: event.target.value
                }))
              }
              sx={{ minWidth: 220 }}
            />
          </Stack>

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Chip label={`${filteredMatches.length} partidos visibles`} variant='outlined' />
            <Chip label={`${matches.length} partidos totales`} variant='outlined' />
          </Stack>
        </Stack>
      </PageFiltersBar>
      {/* </Card> */}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : filteredMatches.length === 0 ? (
        <Alert severity='info'>No hay partidos que coincidan con los filtros aplicados.</Alert>
      ) : (
        <Stack spacing={2}>
          {filteredMatches.map((match) => {
            const draft = drafts[match.id];
            const isDirty = hasDraftChanged(match, draft);
            const isSavingThisRow = savingMatchId === match.id;

            return (
              <Card key={match.id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Box>
                      <MatchVs
                        match={
                          {
                            homeTeamCode: match.home_team_code,
                            awayTeamCode: match.away_team_code,
                            homeTeam: match.home_team,
                            awayTeam: match.away_team
                          } as any
                        }
                      />

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

                      <Button
                        variant='contained'
                        onClick={() => void handleSave(match.id)}
                        disabled={isSavingThisRow || !isDirty}
                      >
                        {isSavingThisRow ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
