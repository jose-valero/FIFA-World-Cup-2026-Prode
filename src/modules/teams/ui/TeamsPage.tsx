import * as React from 'react';
import { Alert, CircularProgress, Grid, Stack } from '@mui/material';
import { PageHeader } from '../../../shared/components/PageHeader';
import { TeamCard } from '../components/TeamCard';
import { TeamFiltersCard } from '../components/TeamFiltersCard';
import { useTeamsCatalog } from '../hooks/useTeamsCatalog';
import type { TeamsCatalogFilters } from '../types/teams.types';
import { filterTeamsCatalog } from '../utils/filterTeamsCatalog';

export function TeamsPage() {
  const [filters, setFilters] = React.useState<TeamsCatalogFilters>({
    search: ''
  });

  const { data: teams = [], isLoading, isError, error } = useTeamsCatalog();

  const filteredTeams = React.useMemo(() => {
    return filterTeamsCatalog(teams, filters);
  }, [teams, filters]);

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title='Equipos'
        description='Consulta el catálogo de selecciones y entra al detalle de cada equipo.'
      />

      <TeamFiltersCard
        filters={filters}
        onChange={(field, value) =>
          setFilters((prev) => ({
            ...prev,
            [field]: value
          }))
        }
      />

      {isError ? (
        <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudieron cargar los equipos'}</Alert>
      ) : null}

      {isLoading ? (
        <Stack alignItems='center' sx={{ py: 6 }}>
          <CircularProgress />
        </Stack>
      ) : filteredTeams.length === 0 ? (
        <Alert severity='info'>No se encontraron equipos con ese filtro.</Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredTeams.map((team) => (
            <Grid key={team.id} size={{ xs: 12, md: 6, xl: 4 }}>
              <TeamCard team={team} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  );
}
