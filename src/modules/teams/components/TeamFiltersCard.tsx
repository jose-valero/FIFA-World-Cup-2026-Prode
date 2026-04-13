import { Grid, TextField } from '@mui/material';
import { PageFiltersBar } from '../../../shared/components/PageFiltersBar';
import type { TeamsCatalogFilters } from '../types/teams.types';

type TeamFiltersCardProps = {
  filters: TeamsCatalogFilters;
  onChange: (field: keyof TeamsCatalogFilters, value: string) => void;
};

export function TeamFiltersCard({ filters, onChange }: TeamFiltersCardProps) {
  const activeCount = filters.search ? 1 : 0;

  return (
    <PageFiltersBar title='Filtrar equipos' activeCount={activeCount} collapsible>
      <Grid container spacing={1.5} sx={{ pt: 0.25 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label='Equipo'
            fullWidth
            size='small'
            placeholder='Buscar por nombre, código o nombre corto'
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
          />
        </Grid>
      </Grid>
    </PageFiltersBar>
  );
}
