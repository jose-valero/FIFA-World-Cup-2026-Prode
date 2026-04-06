import { Card, CardContent, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { MatchListFilters, StageOption } from '../listFilters';

type MatchFiltersCardProps = {
  title?: string;
  filters: MatchListFilters & {
    status?: string;
  };
  onChange: (field: 'stage' | 'groupCode' | 'teamQuery' | 'status', value: string) => void;
  stageOptions: ReadonlyArray<StageOption>;
  groupOptions: string[];
  statusOptions?: string[];
};

export function MatchFiltersCard({
  title = 'Filtros',
  filters,
  onChange,
  stageOptions,
  groupOptions,
  statusOptions
}: MatchFiltersCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant='h6' fontWeight={800}>
            {title}
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: statusOptions ? 3 : 4 }}>
              <TextField
                select
                label='Etapa'
                fullWidth
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
                placeholder='Buscar por país o código'
                value={filters.teamQuery}
                onChange={(event) => onChange('teamQuery', event.target.value)}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
