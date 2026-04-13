import { Alert, Avatar, Button, Card, CardContent, CircularProgress, Stack, Typography, Chip } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import { Link as RouterLink, useParams } from 'react-router';
import { routes } from '../../../app/router/routes';
import { PageHeader } from '../../../shared/components/PageHeader';
import { TeamPlayersList } from '../components/TeamPlayersList';
import { useTeamDetail } from '../hooks/useTeamDetail';

export function TeamDetailPage() {
  const { teamId } = useParams();

  const { data, isLoading, isError, error } = useTeamDetail(teamId);

  if (isLoading) {
    return (
      <Stack alignItems='center' sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (isError) {
    return <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudo cargar el equipo'}</Alert>;
  }

  if (!data) {
    return <Alert severity='warning'>No se encontró el equipo solicitado.</Alert>;
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={data.name}
        description='Detalle enriquecido del equipo y su plantilla actual.'
        actions={
          <Button component={RouterLink} to={routes.teams} startIcon={<ArrowBackRoundedIcon />}>
            Volver a equipos
          </Button>
        }
      />

      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Avatar src={data.logoUrl ?? undefined} alt={data.name} sx={{ width: 72, height: 72 }} />

            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant='h5' fontWeight={800}>
                {data.name}
              </Typography>

              <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                {data.code ? <Chip label={data.code} variant='outlined' size='small' /> : null}
                {data.shortName ? <Chip label={data.shortName} variant='outlined' size='small' /> : null}
                {data.group ? (
                  <Chip label={`Grupo ${data.group}`} color='secondary' variant='outlined' size='small' />
                ) : null}
                {data.confederation.label ? (
                  <Chip label={data.confederation.label} color='primary' variant='outlined' size='small' />
                ) : null}
              </Stack>

              <Typography color='text.secondary'>País: {data.country ?? '—'}</Typography>
              <Typography color='text.secondary'>Fundación: {data.founded ?? '—'}</Typography>
              <Typography color='text.secondary'>
                Selección nacional: {data.national === null ? '—' : data.national ? 'Sí' : 'No'}
              </Typography>
              <Typography color='text.secondary'>Estadio: {data.venue.name ?? '—'}</Typography>
              <Typography color='text.secondary'>Ciudad: {data.venue.city ?? '—'}</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1}>
        <Typography variant='h6' fontWeight={800}>
          Jugadores
        </Typography>
        <TeamPlayersList players={data.players} />
      </Stack>
    </Stack>
  );
}
