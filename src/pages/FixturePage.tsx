import * as React from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { getMatches } from '../features/matches/matches.api';
import type { Match } from '../features/matches/types';
import { KnockoutBracket } from '../features/tournament/components/KnockoutBracket';
import { buildProjectedKnockoutMatches } from '../features/tournament/buildProjectedKnockoutMatches';
type FixtureViewMode = 'group_stage' | 'knockout';

type ClientGroupStandingRow = {
  group_code: string;
  team_id: string;
  team_code: string;
  team_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  rank_in_group: number;
};

function getStatusLabel(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'En vivo';
    case 'finished':
      return 'Finalizado';
    case 'scheduled':
    default:
      return 'Pendiente';
  }
}

function getStatusColor(status: Match['status']) {
  switch (status) {
    case 'live':
      return 'error';
    case 'finished':
      return 'success';
    case 'scheduled':
    default:
      return 'warning';
  }
}

function sortMatches(matches: Match[]) {
  return [...matches].sort((a, b) => {
    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
  });
}

function getInitialFixtureView(matches: Match[]): FixtureViewMode {
  const groupStageMatches = matches.filter((match) => match.stage === 'group_stage');

  if (groupStageMatches.length === 0) {
    const hasKnockoutMatches = matches.some((match) => match.stage !== 'group_stage');
    return hasKnockoutMatches ? 'knockout' : 'group_stage';
  }

  const isGroupStageFinished = groupStageMatches.every((match) => match.status === 'finished');

  return isGroupStageFinished ? 'knockout' : 'group_stage';
}

function getScoreLabel(match: Match) {
  if (match.officialHomeScore === null || match.officialAwayScore === null) {
    return null;
  }

  return `${match.officialHomeScore} - ${match.officialAwayScore}`;
}

function getGroupStageLabel(groupCode: string) {
  return `Grupo ${groupCode}`;
}

function groupMatchesByCode(matches: Match[]) {
  return matches
    .filter((match) => match.stage === 'group_stage' && match.groupCode)
    .reduce<Record<string, Match[]>>((acc, match) => {
      const key = match.groupCode as string;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(match);
      return acc;
    }, {});
}

function buildClientGroupStandings(matches: Match[]): ClientGroupStandingRow[] {
  const groupMatches = matches.filter(
    (match) => match.stage === 'group_stage' && match.groupCode && match.homeTeam && match.awayTeam
  );

  const table = new Map<string, ClientGroupStandingRow>();

  function ensureTeam(groupCode: string, teamName: string, teamCode: string | null) {
    const key = `${groupCode}:${teamCode || teamName}`;

    if (!table.has(key)) {
      table.set(key, {
        group_code: groupCode,
        team_id: key,
        team_code: teamCode || '',
        team_name: teamName,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0,
        rank_in_group: 0
      });
    }

    return table.get(key)!;
  }

  for (const match of groupMatches) {
    const groupCode = match.groupCode as string;

    const home = ensureTeam(groupCode, match.homeTeam, match.homeTeamCode);
    const away = ensureTeam(groupCode, match.awayTeam, match.awayTeamCode);

    if (match.officialHomeScore === null || match.officialAwayScore === null) {
      continue;
    }

    const homeGoals = match.officialHomeScore;
    const awayGoals = match.officialAwayScore;

    home.played += 1;
    away.played += 1;

    home.goals_for += homeGoals;
    home.goals_against += awayGoals;
    away.goals_for += awayGoals;
    away.goals_against += homeGoals;

    if (homeGoals > awayGoals) {
      home.wins += 1;
      away.losses += 1;
      home.points += 3;
    } else if (homeGoals < awayGoals) {
      away.wins += 1;
      home.losses += 1;
      away.points += 3;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const rows = Array.from(table.values()).map((row) => ({
    ...row,
    goal_difference: row.goals_for - row.goals_against
  }));

  const grouped = rows.reduce<Record<string, ClientGroupStandingRow[]>>((acc, row) => {
    if (!acc[row.group_code]) {
      acc[row.group_code] = [];
    }

    acc[row.group_code].push(row);
    return acc;
  }, {});

  return Object.entries(grouped).flatMap(([groupCode, groupRows]) => {
    const sorted = [...groupRows].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
      return a.team_name.localeCompare(b.team_name);
    });

    return sorted.map((row, index) => ({
      ...row,
      group_code: groupCode,
      rank_in_group: index + 1
    }));
  });
}

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
  const score = getScoreLabel(match);

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

        <Typography fontWeight={800}>
          {match.homeTeam} vs {match.awayTeam}
        </Typography>

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

export function FixturePage() {
  const [matches, setMatches] = React.useState<Match[]>([]);
  const [fixtureView, setFixtureView] = React.useState<FixtureViewMode>('group_stage');
  const [didInitView, setDidInitView] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const matchesData = await getMatches();
        setMatches(matchesData);

        if (!didInitView) {
          setFixtureView(getInitialFixtureView(matchesData));
          setDidInitView(true);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo cargar el fixture';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, [didInitView]);

  const standings = React.useMemo(() => buildClientGroupStandings(matches), [matches]);
  const groupedMatches = groupMatchesByCode(matches);
  const groupedStandings = groupStandingsByCode(standings);
  const groupCodes = Object.keys(groupedMatches).sort();

  const knockoutMatches = React.useMemo(() => {
    return buildProjectedKnockoutMatches(matches);
  }, [matches]);

  return (
    <Stack spacing={3}>
      <Card elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant='h4' fontWeight={800}>
                Fixture del torneo
              </Typography>

              <Typography color='text.secondary' sx={{ mt: 1 }}>
                Consulta la fase activa del Mundial: grupos con tabla de posiciones o cuadro de eliminación.
              </Typography>
            </Box>

            <ToggleButtonGroup
              value={fixtureView}
              exclusive
              onChange={(_, value: FixtureViewMode | null) => {
                if (!value) return;
                setFixtureView(value);
              }}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <ToggleButton value='group_stage' sx={{ borderRadius: 999 }}>
                Fase de grupos
              </ToggleButton>
              <ToggleButton value='knockout' sx={{ borderRadius: 999 }}>
                Fase de eliminación
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : errorMessage ? null : fixtureView === 'group_stage' ? (
        <Stack spacing={3}>
          {groupCodes.length === 0 ? (
            <Alert severity='info'>Aún no hay partidos cargados para la fase de grupos.</Alert>
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
              {groupCodes.map((groupCode) => {
                const groupMatches = sortMatches(groupedMatches[groupCode] ?? []);
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
                        <Typography variant='h5' fontWeight={800}>
                          {getGroupStageLabel(groupCode)}
                        </Typography>

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
                                        <Stack direction='row' spacing={1}>
                                          <Typography fontWeight={700}>{row.team_name}</Typography>
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

                        <Box>
                          <Typography variant='overline' color='text.secondary'>
                            Partidos del grupo
                          </Typography>

                          <Stack spacing={1.5} sx={{ mt: 1 }}>
                            {groupMatches.map((match) => (
                              <GroupMatchCard key={match.id} match={match} />
                            ))}
                          </Stack>
                        </Box>
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
          {/* <KnockoutBracket matches={matches.filter((match) => match.stage !== 'group_stage')} /> */}
        </Stack>
      )}
    </Stack>
  );
}
