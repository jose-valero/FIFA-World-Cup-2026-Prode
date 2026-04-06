import * as React from 'react';
import {
  getStageLabel,
  stageOptions as tournamentStageOptions,
  type TournamentStage
} from '../features/tournament/stages';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  createAdminMatch,
  deleteAdminMatch,
  getAdminMatches,
  updateAdminMatch,
  type AdminMatchRow,
  type AdminMatchStatus
} from '../features/admin/adminMatches.api';
import { getTeams, type TeamRow } from '../features/teams/teams.api';

import { MatchFiltersCard } from '../features/matches/components/MatchFiltersCard';
import {
  getUniqueGroupOptions,
  getUniqueStageOptions,
  normalizeText,
  type MatchListFilters
} from '../features/matches/listFilters';
import { getStatusLabel } from '../features/matches/helpers/getStatusLabel';
import { getStatusColor } from '../features/matches/helpers/getStatusColor';
import { MatchVs } from '../features/matches/components/MatchVs';

type FormState = {
  id: string;
  stage: TournamentStage;
  matchday: string;
  groupOrder: string;
  groupName: string;
  homeTeam: string;
  awayTeam: string;

  homeTeamId: string;
  awayTeamId: string;
  homeTeamCode: string;
  awayTeamCode: string;
  kickoffAt: string;
  stadium: string;
  city: string;
  status: AdminMatchStatus;
};

const emptyForm: FormState = {
  id: '',
  stage: 'group_stage',
  matchday: '',
  groupOrder: '',
  groupName: '',
  homeTeam: '',
  awayTeam: '',
  homeTeamId: '',
  awayTeamId: '',
  homeTeamCode: '',
  awayTeamCode: '',
  kickoffAt: '',
  stadium: '',
  city: '',
  status: 'scheduled'
};

function formatKickoff(isoDate: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoDate));
}

function toDateTimeLocal(isoDate: string) {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function mapMatchToForm(match: AdminMatchRow): FormState {
  return {
    id: match.id,
    stage: match.stage,
    matchday: match.matchday !== null ? String(match.matchday) : '',
    groupOrder: match.group_order !== null ? String(match.group_order) : '',
    groupName: match.group_name,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    homeTeamId: match.home_team_id ?? '',
    awayTeamId: match.away_team_id ?? '',
    homeTeamCode: match.home_team_code ?? '',
    awayTeamCode: match.away_team_code ?? '',
    kickoffAt: toDateTimeLocal(match.kickoff_at),
    stadium: match.stadium,
    city: match.city,
    status: match.status
  };
}

function buildSourceSlot(match: AdminMatchRow, side: 'home' | 'away'): string | null {
  const sourceType = side === 'home' ? match.home_source_type : match.away_source_type;
  const groupCode = side === 'home' ? match.home_source_group_code : match.away_source_group_code;
  const groupRank = side === 'home' ? match.home_source_group_rank : match.away_source_group_rank;
  const groupSet = side === 'home' ? match.home_source_group_set : match.away_source_group_set;
  const sourceMatchId = side === 'home' ? match.home_source_match_id : match.away_source_match_id;
  const teamCode = side === 'home' ? match.home_team_code : match.away_team_code;

  if (match.stage === 'group_stage') {
    return null;
  }

  switch (sourceType) {
    case 'group_position':
      return groupCode && groupRank ? `${groupRank}${groupCode}` : null;
    case 'best_third_place':
      return groupSet ? `3${groupSet}` : null;
    case 'match_winner':
      return sourceMatchId ? `W${sourceMatchId}` : null;
    case 'match_loser':
      return sourceMatchId ? `L${sourceMatchId}` : null;
    case 'team':
      return teamCode || null;
    default:
      return null;
  }
}

function buildExpectedPairLabel(match: AdminMatchRow) {
  if (match.stage === 'group_stage') return null;

  const home = buildSourceSlot(match, 'home');
  const away = buildSourceSlot(match, 'away');

  if (!home && !away) return null;

  return `${home ?? 'TBD'} vs ${away ?? 'TBD'}`;
}

function isValidDateTimeLocal(value: string) {
  if (!value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeMatchId(value: string) {
  return value.trim();
}

function hasManualOverride(match: AdminMatchRow) {
  if (match.stage === 'group_stage') {
    return false;
  }

  const expectedHomeSlot = buildSourceSlot(match, 'home');
  const expectedAwaySlot = buildSourceSlot(match, 'away');

  const homeLooksManual =
    Boolean(match.home_team_code) && expectedHomeSlot !== null && match.home_team_code !== expectedHomeSlot;

  const awayLooksManual =
    Boolean(match.away_team_code) && expectedAwaySlot !== null && match.away_team_code !== expectedAwaySlot;

  return homeLooksManual || awayLooksManual;
}

function validateAdminMatchForm(input: FormState) {
  const id = normalizeMatchId(input.id);
  const homeTeam = input.homeTeam.trim();
  const awayTeam = input.awayTeam.trim();
  const homeCode = input.homeTeamCode.trim();
  const awayCode = input.awayTeamCode.trim();
  const groupName = input.groupName.trim();

  if (
    !id ||
    !input.stage.trim() ||
    !groupName ||
    !homeTeam ||
    !awayTeam ||
    !input.kickoffAt.trim() ||
    !input.stadium.trim() ||
    !input.city.trim()
  ) {
    return 'Completa todos los campos obligatorios.';
  }

  if (/\s/.test(id)) {
    return 'El ID del partido no debe contener espacios.';
  }

  if (!isValidDateTimeLocal(input.kickoffAt)) {
    return 'La fecha y hora del partido no es válida.';
  }

  if (homeTeam === awayTeam) {
    return 'El equipo local y el visitante no pueden ser el mismo.';
  }

  if (homeCode && awayCode && homeCode === awayCode) {
    return 'El código local y el código visitante no pueden ser iguales.';
  }

  const parsedMatchday = input.matchday.trim() === '' ? null : Number(input.matchday);
  const parsedGroupOrder = input.groupOrder.trim() === '' ? null : Number(input.groupOrder);

  if (
    (parsedMatchday !== null && (!Number.isInteger(parsedMatchday) || parsedMatchday < 0)) ||
    (parsedGroupOrder !== null && (!Number.isInteger(parsedGroupOrder) || parsedGroupOrder < 0))
  ) {
    return 'Jornada y orden deben ser números enteros válidos mayores o iguales a 0.';
  }

  if (input.stage === 'group_stage') {
    if (parsedMatchday === null || parsedGroupOrder === null) {
      return 'En fase de grupos debes completar jornada y orden.';
    }

    if (!/^grupo\s+[a-l]$/i.test(groupName)) {
      return 'En fase de grupos usa un nombre válido como “Grupo A”.';
    }
  }

  return null;
}

function getDefaultGroupNameForStage(stage: TournamentStage) {
  return stage === 'group_stage' ? 'Grupo A' : getStageLabel(stage);
}

export function AdminMatchesPage() {
  const [matches, setMatches] = React.useState<AdminMatchRow[]>([]);
  const [teams, setTeams] = React.useState<TeamRow[]>([]);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [editingMatch, setEditingMatch] = React.useState<AdminMatchRow | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const [filters, setFilters] = React.useState<MatchListFilters & { status: string }>({
    stage: '',
    groupCode: '',
    teamQuery: '',
    status: ''
  });

  const [matchPendingDelete, setMatchPendingDelete] = React.useState<AdminMatchRow | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [matchesData, teamsData] = await Promise.all([getAdminMatches(), getTeams()]);
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudieron cargar los datos';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleFormChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleStageChange = (nextStage: TournamentStage) => {
    setForm((prev) => {
      const currentGroupName = prev.groupName.trim();
      const looksLikeGroup = /^grupo\s+[a-l]$/i.test(currentGroupName);

      let nextGroupName = prev.groupName;

      if (!currentGroupName) {
        nextGroupName = getDefaultGroupNameForStage(nextStage);
      } else if (nextStage === 'group_stage' && !looksLikeGroup) {
        nextGroupName = 'Grupo A';
      } else if (nextStage !== 'group_stage' && looksLikeGroup) {
        nextGroupName = getStageLabel(nextStage);
      }

      return {
        ...prev,
        stage: nextStage,
        groupName: nextGroupName
      };
    });
  };

  function getExpectedSlotForEditing(editingMatch: AdminMatchRow | null, side: 'home' | 'away') {
    if (!editingMatch) return null;
    return buildSourceSlot(editingMatch, side);
  }

  const handleTeamSelection = (side: 'home' | 'away', nextCode: string) => {
    const selectedTeam = teams.find((team) => team.code === nextCode);
    const fallbackSlot = getExpectedSlotForEditing(editingMatch, side);

    if (side === 'home') {
      if (!selectedTeam) {
        setForm((prev) => ({
          ...prev,
          homeTeamId: '',
          homeTeamCode: '',
          homeTeam: fallbackSlot ?? ''
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        homeTeamId: selectedTeam.id,
        homeTeamCode: selectedTeam.code ?? '',
        homeTeam: selectedTeam.name
      }));
      return;
    }

    if (!selectedTeam) {
      setForm((prev) => ({
        ...prev,
        awayTeamId: '',
        awayTeamCode: '',
        awayTeam: fallbackSlot ?? ''
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      awayTeamId: selectedTeam.id,
      awayTeamCode: selectedTeam.code ?? '',
      awayTeam: selectedTeam.name
    }));
  };

  const handleResetTeamOverride = (side: 'home' | 'away') => {
    const fallbackSlot = getExpectedSlotForEditing(editingMatch, side);

    if (!fallbackSlot) return;

    if (side === 'home') {
      setForm((prev) => ({
        ...prev,
        homeTeamId: '',
        homeTeamCode: '',
        homeTeam: fallbackSlot
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      awayTeamId: '',
      awayTeamCode: '',
      awayTeam: fallbackSlot
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMatch(null);
    setIsEditing(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleEdit = (match: AdminMatchRow) => {
    setForm(mapMatchToForm(match));
    setEditingMatch(match);
    setIsEditing(true);
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 590, behavior: 'smooth' });
  };

  const handleRequestDelete = (match: AdminMatchRow) => {
    setMatchPendingDelete(match);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleConfirmDelete = async () => {
    if (!matchPendingDelete) return;

    setIsDeleting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteAdminMatch(matchPendingDelete.id);

      setMatches((prev) => prev.filter((match) => match.id !== matchPendingDelete.id));
      setSuccessMessage('Partido eliminado correctamente.');

      if (form.id === matchPendingDelete.id) {
        resetForm();
      }

      setMatchPendingDelete(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el partido';
      setErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return;
    setMatchPendingDelete(null);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateAdminMatchForm(form);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const normalizedId = normalizeMatchId(form.id);
    const duplicatedMatch = matches.find((match) => match.id === normalizedId);

    if (!isEditing && duplicatedMatch) {
      setErrorMessage('Ya existe un partido con ese ID.');
      return;
    }

    const parsedMatchday = form.matchday.trim() === '' ? null : Number(form.matchday);
    const parsedGroupOrder = form.groupOrder.trim() === '' ? null : Number(form.groupOrder);

    setIsSaving(true);

    try {
      const payload = {
        id: normalizedId,
        stage: form.stage,
        matchday: parsedMatchday,
        groupOrder: parsedGroupOrder,
        groupName: form.groupName.trim(),
        homeTeam: form.homeTeam.trim(),
        awayTeam: form.awayTeam.trim(),
        homeTeamId: form.homeTeamId || null,
        awayTeamId: form.awayTeamId || null,
        homeTeamCode: form.homeTeamCode.trim() || null,
        awayTeamCode: form.awayTeamCode.trim() || null,
        kickoffAt: new Date(form.kickoffAt).toISOString(),
        stadium: form.stadium.trim(),
        city: form.city.trim(),
        status: form.status
      };

      if (isEditing) {
        await updateAdminMatch(payload);
        setSuccessMessage('Partido actualizado correctamente.');
      } else {
        await createAdminMatch(payload);
        setSuccessMessage('Partido creado correctamente.');
      }

      await loadData();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo guardar el partido';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const expectedHomeSlot = editingMatch ? buildSourceSlot(editingMatch, 'home') : null;
  const expectedAwaySlot = editingMatch ? buildSourceSlot(editingMatch, 'away') : null;

  const stageFilterOptionsOptions = React.useMemo(() => getUniqueStageOptions(matches), [matches]);
  const groupOptions = React.useMemo(() => getUniqueGroupOptions(matches), [matches]);
  const statusOptions = React.useMemo(() => [...new Set(matches.map((match) => match.status))], [matches]);

  const filteredMatches = React.useMemo(() => {
    return matches.filter((match) => {
      const matchesStage = !filters.stage || match.stage === filters.stage;
      const matchesGroup = !filters.groupCode || match.group_code === filters.groupCode;
      const matchesStatus = !filters.status || match.status === filters.status;

      const teamHaystack = normalizeText(
        [match.home_team, match.away_team, match.home_team_code, match.away_team_code].filter(Boolean).join(' ')
      );

      const matchesTeam = !filters.teamQuery || teamHaystack.includes(normalizeText(filters.teamQuery));

      return matchesStage && matchesGroup && matchesStatus && matchesTeam;
    });
  }, [matches, filters]);

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={1}>
            <Typography variant='h4' fontWeight={800}>
              Admin · Gestión de partidos
            </Typography>
            <Typography color='text.secondary'>
              Crea, edita y elimina partidos del torneo. Para cruces eliminatorios, puedes asignar manualmente los
              clasificados.
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
      {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Typography variant='h5' fontWeight={800}>
              {isEditing ? 'Editar partido' : 'Nuevo partido'}
            </Typography>

            {isEditing && editingMatch && editingMatch.stage !== 'group_stage' ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {expectedHomeSlot ? (
                  <Chip label={`Slot local esperado: ${expectedHomeSlot}`} variant='outlined' />
                ) : null}
                {expectedAwaySlot ? (
                  <Chip label={`Slot visitante esperado: ${expectedAwaySlot}`} variant='outlined' />
                ) : null}
              </Stack>
            ) : null}

            {isEditing && editingMatch && editingMatch.stage !== 'group_stage' ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip
                  label={form.homeTeamId ? 'Local: override manual' : 'Local: automático'}
                  color={form.homeTeamId ? 'warning' : 'default'}
                  variant='outlined'
                />
                <Chip
                  label={form.awayTeamId ? 'Visitante: override manual' : 'Visitante: automático'}
                  color={form.awayTeamId ? 'warning' : 'default'}
                  variant='outlined'
                />
              </Stack>
            ) : null}

            {isEditing && editingMatch ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                <Chip label={getStageLabel(editingMatch.stage)} color='primary' variant='outlined' />

                <Chip
                  label={
                    editingMatch.status === 'scheduled'
                      ? 'Pendiente'
                      : editingMatch.status === 'live'
                        ? 'En vivo'
                        : 'Finalizado'
                  }
                  color={
                    editingMatch.status === 'scheduled'
                      ? 'default'
                      : editingMatch.status === 'live'
                        ? 'error'
                        : 'success'
                  }
                  variant='outlined'
                />

                {editingMatch.stage !== 'group_stage' ? (
                  <Chip
                    label={hasManualOverride(editingMatch) ? 'Override manual activo' : 'Emparejamiento automático'}
                    color={hasManualOverride(editingMatch) ? 'warning' : 'success'}
                    variant='outlined'
                  />
                ) : null}
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label='ID'
                value={form.id}
                onChange={(event) => handleFormChange('id', event.target.value)}
                fullWidth
                disabled={isEditing}
              />

              <TextField
                select
                label='Etapa'
                value={form.stage}
                onChange={(event) => handleStageChange(event.target.value as TournamentStage)}
                fullWidth
              >
                {tournamentStageOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label='Estado'
                value={form.status}
                onChange={(event) => handleFormChange('status', event.target.value)}
                fullWidth
              >
                <MenuItem value='scheduled'>Pendiente</MenuItem>
                <MenuItem value='live'>En vivo</MenuItem>
                <MenuItem value='finished'>Finalizado</MenuItem>
              </TextField>
            </Stack>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label='Grupo / bloque'
                value={form.groupName}
                onChange={(event) => handleFormChange('groupName', event.target.value)}
                fullWidth
                helperText={
                  form.stage === 'group_stage'
                    ? 'Ejemplo: Grupo A'
                    : 'Puedes usar algo como Round of 32, Quarterfinals, etc.'
                }
              />

              <TextField
                label='Jornada'
                type='number'
                value={form.matchday}
                onChange={(event) => handleFormChange('matchday', event.target.value)}
                fullWidth
              />

              <TextField
                label='Orden en grupo / fase'
                type='number'
                value={form.groupOrder}
                onChange={(event) => handleFormChange('groupOrder', event.target.value)}
                fullWidth
              />
            </Stack>

            <Stack spacing={2}>
              <Typography variant='subtitle1' fontWeight={700}>
                Equipos
              </Typography>
              {form.stage !== 'group_stage' ? (
                <Alert severity='info'>
                  En cruces eliminatorios puedes dejar el emparejamiento automático según el slot base o forzar
                  manualmente un país si necesitas corregirlo.
                </Alert>
              ) : (
                <Alert severity='info'>
                  En fase de grupos asegúrate de que el nombre del grupo, la jornada y el orden estén completos para que
                  el fixture quede bien ordenado.
                </Alert>
              )}

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  select
                  label='Equipo local'
                  value={form.homeTeamCode}
                  onChange={(event) => handleTeamSelection('home', event.target.value)}
                  fullWidth
                  helperText={expectedHomeSlot ? `Cruce base: ${expectedHomeSlot}` : undefined}
                >
                  <MenuItem value=''>Por definir</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.code!}>
                      {team.name} ({team.code})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label='Código local'
                  value={form.homeTeamCode}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />

                <TextField
                  select
                  label='Equipo visitante'
                  value={form.awayTeamCode}
                  onChange={(event) => handleTeamSelection('away', event.target.value)}
                  fullWidth
                  helperText={expectedAwaySlot ? `Cruce base: ${expectedAwaySlot}` : undefined}
                >
                  <MenuItem value=''>Por definir</MenuItem>
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.code!}>
                      {team.name} ({team.code})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label='Código visitante'
                  value={form.awayTeamCode}
                  fullWidth
                  slotProps={{ input: { readOnly: true } }}
                />
              </Stack>
            </Stack>

            {isEditing && editingMatch && editingMatch.stage !== 'group_stage' ? (
              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {expectedHomeSlot ? (
                  <Button variant='outlined' size='small' onClick={() => handleResetTeamOverride('home')}>
                    Restaurar slot local
                  </Button>
                ) : null}

                {expectedAwaySlot ? (
                  <Button variant='outlined' size='small' onClick={() => handleResetTeamOverride('away')}>
                    Restaurar slot visitante
                  </Button>
                ) : null}
              </Stack>
            ) : null}

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label='Fecha y hora'
                type='datetime-local'
                value={form.kickoffAt}
                onChange={(event) => handleFormChange('kickoffAt', event.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />

              <TextField
                label='Estadio'
                value={form.stadium}
                onChange={(event) => handleFormChange('stadium', event.target.value)}
                fullWidth
              />

              <TextField
                label='Ciudad'
                value={form.city}
                onChange={(event) => handleFormChange('city', event.target.value)}
                fullWidth
              />
            </Stack>

            <Stack direction='row' spacing={2}>
              <Button variant='contained' onClick={() => void handleSubmit()} disabled={isSaving}>
                {isEditing ? 'Guardar cambios' : 'Crear partido'}
              </Button>

              {isEditing ? (
                <Button variant='outlined' onClick={resetForm}>
                  Cancelar edición
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <MatchFiltersCard
        title='Filtrar partidos del admin'
        filters={filters}
        onChange={(field, value) =>
          setFilters((prev) => ({
            ...prev,
            [field]: value
          }))
        }
        stageOptions={stageFilterOptionsOptions}
        groupOptions={groupOptions}
        statusOptions={statusOptions}
      />

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : filteredMatches.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography variant='h6' fontWeight={800}>
                No hay partidos para mostrar
              </Typography>
              <Typography color='text.secondary'>
                No encontramos partidos con los filtros actuales. Prueba cambiando etapa, grupo, equipo o estado.
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredMatches.map((match) => {
            const expectedPair = buildExpectedPairLabel(match);

            return (
              <Card key={match.id} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    <Box>
                      <Stack spacing={1}>
                        <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap alignItems='center'>
                          <Chip label={getStageLabel(match.stage)} size='small' variant='outlined' />
                          <Chip
                            label={getStatusLabel(match.status)}
                            size='small'
                            color={getStatusColor(match.status)}
                            variant='outlined'
                          />
                        </Stack>

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

                        {expectedPair ? (
                          <Chip label={expectedPair} size='small' color='primary' variant='outlined' />
                        ) : null}

                        {match.stage !== 'group_stage' ? (
                          <Chip
                            label={hasManualOverride(match) ? 'Manual' : 'Automático'}
                            size='small'
                            color={hasManualOverride(match) ? 'warning' : 'success'}
                            variant='outlined'
                          />
                        ) : null}
                      </Stack>

                      <Typography variant='body2' color='text.secondary'>
                        {match.group_name} · Jornada {match.matchday ?? '-'} · Orden {match.group_order ?? '-'}
                      </Typography>

                      {expectedPair ? (
                        <Typography variant='body2' color='text.secondary'>
                          Cruce base: {expectedPair}
                        </Typography>
                      ) : null}

                      <Typography variant='body2' color='text.secondary'>
                        {formatKickoff(match.kickoff_at)} · {match.stadium} · {match.city}
                      </Typography>
                    </Box>

                    <Stack direction='row' spacing={1}>
                      <Button variant='outlined' onClick={() => handleEdit(match)}>
                        Editar
                      </Button>

                      <Button color='error' variant='outlined' onClick={() => handleRequestDelete(match)}>
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog open={Boolean(matchPendingDelete)} onClose={handleCloseDeleteDialog} fullWidth maxWidth='xs'>
        <DialogTitle>Eliminar partido</DialogTitle>

        <DialogContent>
          <DialogContentText>
            {matchPendingDelete
              ? `Vas a eliminar el partido ${matchPendingDelete.home_team} vs ${matchPendingDelete.away_team}. Esta acción no se puede deshacer.`
              : 'Esta acción no se puede deshacer.'}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting}>
            Cancelar
          </Button>

          <Button color='error' variant='contained' onClick={() => void handleConfirmDelete()} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
