import * as React from 'react';
import { getStageLabel, stageOptions, type TournamentStage } from '../features/tournament/stages';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
  };

  const handleEdit = (match: AdminMatchRow) => {
    setForm(mapMatchToForm(match));
    setEditingMatch(match);
    setIsEditing(true);
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 590, behavior: 'smooth' });
  };

  const handleDelete = async (matchId: string) => {
    const confirmed = window.confirm('¿Seguro que deseas eliminar este partido?');
    if (!confirmed) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteAdminMatch(matchId);
      setMatches((prev) => prev.filter((match) => match.id !== matchId));
      setSuccessMessage('Partido eliminado correctamente.');

      if (form.id === matchId) {
        resetForm();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo eliminar el partido';
      setErrorMessage(message);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (
      !form.id.trim() ||
      !form.stage.trim() ||
      !form.groupName.trim() ||
      !form.homeTeam.trim() ||
      !form.awayTeam.trim() ||
      !form.kickoffAt.trim() ||
      !form.stadium.trim() ||
      !form.city.trim()
    ) {
      setErrorMessage('Completa todos los campos obligatorios.');
      return;
    }

    const parsedMatchday = form.matchday.trim() === '' ? null : Number(form.matchday);
    const parsedGroupOrder = form.groupOrder.trim() === '' ? null : Number(form.groupOrder);

    if (
      (parsedMatchday !== null && (Number.isNaN(parsedMatchday) || parsedMatchday < 0)) ||
      (parsedGroupOrder !== null && (Number.isNaN(parsedGroupOrder) || parsedGroupOrder < 0))
    ) {
      setErrorMessage('Jornada y orden deben ser números válidos mayores o iguales a 0.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        id: form.id.trim(),
        stage: form.stage.trim() as TournamentStage,
        matchday: parsedMatchday,
        groupOrder: parsedGroupOrder,
        groupName: form.groupName.trim(),
        homeTeam: form.homeTeam.trim(),
        awayTeam: form.awayTeam.trim(),
        homeTeamId: form.homeTeamId.trim() || null,
        awayTeamId: form.awayTeamId.trim() || null,
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

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
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

      <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
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
                onChange={(event) => handleFormChange('stage', event.target.value)}
                fullWidth
              >
                {stageOptions.map((option) => (
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

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : (
        <Stack spacing={2}>
          {matches.map((match) => {
            const expectedPair = buildExpectedPairLabel(match);

            return (
              <Card key={match.id} elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    justifyContent='space-between'
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                  >
                    <Box>
                      <Typography variant='h6' fontWeight={800}>
                        {match.home_team} vs {match.away_team}
                      </Typography>

                      <Typography variant='body2' color='text.secondary'>
                        {getStageLabel(match.stage)} · {match.group_name} · Jornada {match.matchday ?? '-'} · Orden{' '}
                        {match.group_order ?? '-'}
                      </Typography>

                      {expectedPair ? (
                        <Typography variant='body2' color='text.secondary'>
                          Cruce base: {expectedPair}
                        </Typography>
                      ) : null}

                      <Typography variant='body2' color='text.secondary'>
                        {formatKickoff(match.kickoff_at)} · {match.stadium} · {match.city}
                      </Typography>

                      <Typography variant='body2' color='text.secondary'>
                        Estado: {match.status}
                      </Typography>
                    </Box>

                    <Stack direction='row' spacing={1}>
                      <Button variant='outlined' onClick={() => handleEdit(match)}>
                        Editar
                      </Button>

                      <Button color='error' variant='outlined' onClick={() => void handleDelete(match.id)}>
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
    </Stack>
  );
}
