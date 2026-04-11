import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { MatchVs } from '../../../shared/components/MatchVs';
import { useMatches } from '../../matches/hooks/useMatches';
import { buildProjectedKnockoutMatches } from '../../tournament/utils/buildProjectedKnockoutMatches';
import { getUniqueGroupOptions, matchTeamQuery } from '../../matches/utils/listFilters';
import { PageHeader, type PageHeaderBadge } from '../../../shared/components/PageHeader';
import { PageFiltersBar } from '../../../shared/components/PageFiltersBar';
import { KnockoutBracket } from '../../tournament/components/KnockoutBracket';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Match } from '../../matches/types/types';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { getStatusLabel } from '../../../shared/utils/getStatusLabel';
import { getStatusColor } from '../../../shared/utils/getStatusColor';
import { sortMatches } from '../../../shared/utils/sortMatches';
import type { ClientGroupStandingRow, FixtureViewMode, GroupStageStatusFilter } from '../types/fixture.types';
import { initialFixtureView } from '../helpers/initialFixtureView';
import { scoreLabel } from '../helpers/scoreLabel';
import { buildClientGroupStandings } from '../helpers/buildClientGroupStandings';

function groupStandingsByCode(rows: ClientGroupStandingRow[]) {
  return rows.reduce<Record<string, ClientGroupStandingRow[]>>((acc, row) => {
    if (!acc[row.group_code]) {
      acc[row.group_code] = [];
    }

    acc[row.group_code].push(row);
    return acc;
  }, {});
}

function GroupMatchCard({ match }: { match: Match }) {
  const score = scoreLabel(match);

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack spacing={1}>
        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
          <Chip
            label={getStatusLabel(match.status)}
            size='small'
            color={getStatusColor(match.status)}
            variant='outlined'
          />
          {score ? <Chip label={score} size='small' color='primary' /> : null}
        </Stack>

        <MatchVs match={match} />

        <Typography variant='body2' color='text.secondary'>
          {match.kickoff}
        </Typography>

        <Typography variant='caption' color='text.secondary'>
          {match.stadium} · {match.city}
        </Typography>
      </Stack>
    </Box>
  );
}

function isGroupCompleted(matches: Match[]) {
  if (matches.length === 0) return false;
  return matches.every((match) => match.status === 'finished');
}

function countActiveGroupFilters(groupCode: string, teamQuery: string, statusFilter: GroupStageStatusFilter) {
  return [groupCode, teamQuery, statusFilter].filter(Boolean).length;
}

export function FixturePage() {
  const [fixtureView, setFixtureView] = React.useState<FixtureViewMode>('group_stage');
  const [didInitView, setDidInitView] = React.useState(false);
  const [groupCodeFilter, setGroupCodeFilter] = React.useState('');
  const [teamQuery, setTeamQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<GroupStageStatusFilter>('');

  const { data: matches = [], isLoading, isError, error } = useMatches();
  const errorMessage = isError ? (error instanceof Error ? error.message : 'No se pudo cargar el fixture') : '';

  React.useEffect(() => {
    if (didInitView) return;
    if (matches.length === 0) return;

    setFixtureView(initialFixtureView(matches));
    setDidInitView(true);
  }, [didInitView, matches]);

  const groupStageMatches = React.useMemo(() => {
    return matches.filter((match) => match.stage === 'group_stage');
  }, [matches]);

  const knockoutMatches = React.useMemo(() => {
    return buildProjectedKnockoutMatches(matches);
  }, [matches]);

  const standings = React.useMemo(() => buildClientGroupStandings(matches), [matches]);
  const groupedStandings = groupStandingsByCode(standings);

  const groupOptions = React.useMemo(() => getUniqueGroupOptions(groupStageMatches), [groupStageMatches]);

  const filteredGroupStageMatches = React.useMemo(() => {
    return sortMatches(
      groupStageMatches.filter((match) => {
        const matchesGroup = !groupCodeFilter || match.groupCode === groupCodeFilter;
        const matchesTeam = !teamQuery || matchTeamQuery(match, teamQuery);
        const matchesStatus = !statusFilter || match.status === statusFilter;

        return matchesGroup && matchesTeam && matchesStatus;
      })
    );
  }, [groupCodeFilter, groupStageMatches, statusFilter, teamQuery]);

  const groupedFilteredMatches = React.useMemo(() => {
    return filteredGroupStageMatches.reduce<Record<string, Match[]>>((acc, match) => {
      const key = match.groupCode ?? '';

      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(match);
      return acc;
    }, {});
  }, [filteredGroupStageMatches]);

  const visibleGroupCodes = React.useMemo(() => {
    return Object.keys(groupedFilteredMatches).sort();
  }, [groupedFilteredMatches]);

  const activeFilterCount = countActiveGroupFilters(groupCodeFilter, teamQuery, statusFilter);

  const badges: PageHeaderBadge[] = [
    {
      label: fixtureView === 'group_stage' ? 'Fase de grupos' : 'Fase de eliminación',
      color: 'primary',
      variant: 'filled'
    },
    {
      label:
        fixtureView === 'group_stage' ? `${groupStageMatches.length} partidos` : `${knockoutMatches.length} cruces`,
      color: 'primary',
      variant: 'outlined'
    },
    ...(fixtureView === 'group_stage'
      ? [
          {
            label: `${groupOptions.length} grupos`,
            color: 'default' as const,
            variant: 'outlined' as const
          }
        ]
      : [])
  ];

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Fixture del torneo'
        description='Consulta la fase activa del Mundial: grupos con tabla de posiciones o cuadro de eliminación.'
        badges={badges}
        tabs={
          <ToggleButtonGroup
            value={fixtureView}
            exclusive
            onChange={(_, value: FixtureViewMode | null) => {
              if (!value) return;
              setFixtureView(value);
            }}
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            <ToggleButton value='group_stage' sx={{ borderRadius: 999 }} color='primary'>
              Fase de grupos
            </ToggleButton>
            <ToggleButton value='knockout' sx={{ borderRadius: 999 }} color='primary'>
              Fase de eliminación
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : errorMessage ? null : fixtureView === 'group_stage' ? (
        <Stack spacing={2.5}>
          <PageFiltersBar title='Filtrar fase de grupos' activeCount={activeFilterCount} collapsible>
            <Grid container spacing={1.5} sx={{ pt: 0.25 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label='Grupo'
                  fullWidth
                  size='small'
                  value={groupCodeFilter}
                  onChange={(event) => setGroupCodeFilter(event.target.value)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  {groupOptions.map((groupCode) => (
                    <MenuItem key={groupCode} value={groupCode}>
                      Grupo {groupCode}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  select
                  label='Estado'
                  fullWidth
                  size='small'
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as GroupStageStatusFilter)}
                >
                  <MenuItem value=''>Todos</MenuItem>
                  <MenuItem value='scheduled'>Pendiente</MenuItem>
                  <MenuItem value='live'>En vivo</MenuItem>
                  <MenuItem value='finished'>Finalizado</MenuItem>
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label='Equipo'
                  fullWidth
                  size='small'
                  placeholder='Buscar por país o código'
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                />
              </Grid>
            </Grid>
          </PageFiltersBar>

          {visibleGroupCodes.length === 0 ? (
            <Alert severity='info'>No se encontraron grupos o partidos que coincidan con los filtros aplicados.</Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  xl: 'repeat(2, minmax(0, 1fr))'
                },
                gap: 2
              }}
            >
              {visibleGroupCodes.map((groupCode) => {
                const groupMatches = groupedFilteredMatches[groupCode] ?? [];
                const groupRows = groupedStandings[groupCode] ?? [];
                const isCompleted = isGroupCompleted(groupMatches);

                return (
                  <Card
                    key={groupCode}
                    elevation={0}
                    sx={{
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2.5}>
                        <Stack
                          direction={{ xs: 'column', md: 'row' }}
                          spacing={1}
                          justifyContent='space-between'
                          alignItems={{ xs: 'flex-start', md: 'center' }}
                        >
                          <Typography variant='h5' fontWeight={800}>
                            {`Grupo ${groupCode}`}
                          </Typography>

                          <Chip label={`${groupMatches.length} partidos`} size='small' variant='outlined' />
                        </Stack>

                        <Box>
                          <Typography variant='overline' color='text.secondary'>
                            Tabla de posiciones
                          </Typography>

                          <TableContainer sx={{ mt: 1 }}>
                            <Table size='small'>
                              <TableHead>
                                <TableRow>
                                  <TableCell>#</TableCell>
                                  <TableCell>Equipo</TableCell>
                                  <TableCell align='right'>PTS</TableCell>
                                  <TableCell align='right'>PJ</TableCell>
                                  <TableCell align='right'>DG</TableCell>
                                  <TableCell align='right'>GF</TableCell>
                                  <TableCell align='right'>GC</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {groupRows.map((row) => {
                                  const stripeColor = !isCompleted
                                    ? 'transparent'
                                    : row.rank_in_group <= 2
                                      ? 'success.main'
                                      : row.rank_in_group === 3
                                        ? 'warning.main'
                                        : 'transparent';

                                  return (
                                    <TableRow
                                      key={row.team_id}
                                      hover
                                      sx={{
                                        '& td:first-of-type': {
                                          borderLeft: '4px solid',
                                          borderLeftColor: stripeColor,
                                          pl: 1.5
                                        }
                                      }}
                                    >
                                      <TableCell>{row.rank_in_group}</TableCell>
                                      <TableCell>
                                        <Stack direction='row' spacing={1} alignItems='center'>
                                          <Stack direction='row' spacing={1} alignItems='center'>
                                            <TeamFlag teamCode={row.team_code} teamName={row.team_name} />
                                            <Typography variant='h6' fontWeight={700}>
                                              {row.team_name}
                                            </Typography>
                                          </Stack>
                                          <Typography variant='caption' color='text.secondary'>
                                            {row.team_code}
                                          </Typography>
                                        </Stack>
                                      </TableCell>
                                      <TableCell align='right'>{row.points}</TableCell>
                                      <TableCell align='right'>{row.played}</TableCell>
                                      <TableCell align='right'>{row.goal_difference}</TableCell>
                                      <TableCell align='right'>{row.goals_for}</TableCell>
                                      <TableCell align='right'>{row.goals_against}</TableCell>
                                    </TableRow>
                                  );
                                })}

                                {groupRows.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={7}>
                                      <Typography variant='body2' color='text.secondary'>
                                        Todavía no hay datos suficientes para la tabla de este grupo.
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ) : null}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>

                        <Divider />

                        <Accordion>
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls={`group-${groupCode}-content`}
                            id={`group-${groupCode}-header`}
                          >
                            <Typography variant='overline' color='text.secondary'>
                              Partidos del grupo {groupCode}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Stack spacing={1.5} sx={{ mt: 1 }}>
                              {groupMatches.map((match) => (
                                <GroupMatchCard key={match.id} match={match} />
                              ))}
                            </Stack>
                          </AccordionDetails>
                        </Accordion>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography variant='h5' fontWeight={800}>
            Fase de eliminación
          </Typography>

          <KnockoutBracket matches={knockoutMatches} />
        </Stack>
      )}
    </Stack>
  );
}
