import { Grid, MenuItem, TextField } from '@mui/material';
import type { MatchListFilters, StageOption } from '../../modules/matches/utils/listFilters';
import { PageFiltersBar } from './PageFiltersBar';

type MatchFiltersCardProps = {
  title?: string;
  filters: MatchListFilters & {
    status?: string;
  };
  onChange: (field: 'stage' | 'groupCode' | 'teamQuery' | 'status', value: string) => void;
  stageOptions: ReadonlyArray<StageOption>;
  groupOptions: string[];
  statusOptions?: string[];
  collapsible?: boolean;
};

function countActiveFilters(filters: MatchFiltersCardProps['filters']) {
  return [filters.stage, filters.groupCode, filters.teamQuery, filters.status].filter(Boolean).length;
}

export function MatchFiltersCard({
  title = 'Filtros',
  filters,
  onChange,
  stageOptions,
  groupOptions,
  statusOptions,
  collapsible = false
}: MatchFiltersCardProps) {
  const activeCount = countActiveFilters(filters);

  return (
    <PageFiltersBar title={title} activeCount={activeCount} collapsible={collapsible}>
      <Grid container spacing={1.5} sx={{ pt: 0.25 }}>
        <Grid size={{ xs: 12, md: statusOptions ? 3 : 4 }}>
          <TextField
            select
            label='Etapa'
            fullWidth
            size='small'
            value={filters.stage}
            onChange={(event) => onChange('stage', event.target.value)}
          >
            <MenuItem value=''>Todas</MenuItem>

            {stageOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: statusOptions ? 3 : 4 }}>
          <TextField
            select
            label='Grupo'
            fullWidth
            size='small'
            value={filters.groupCode}
            onChange={(event) => onChange('groupCode', event.target.value)}
          >
            <MenuItem value=''>Todos</MenuItem>

            {groupOptions.map((groupCode) => (
              <MenuItem key={groupCode} value={groupCode}>
                Grupo {groupCode}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {statusOptions ? (
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              select
              label='Estado'
              fullWidth
              size='small'
              value={filters.status ?? ''}
              onChange={(event) => onChange('status', event.target.value)}
            >
              <MenuItem value=''>Todos</MenuItem>

              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        ) : null}

        <Grid size={{ xs: 12, md: statusOptions ? 3 : 4 }}>
          <TextField
            label='Equipo'
            fullWidth
            size='small'
            placeholder='Buscar por país o código'
            value={filters.teamQuery}
            onChange={(event) => onChange('teamQuery', event.target.value)}
          />
        </Grid>
      </Grid>
    </PageFiltersBar>
  );
}
