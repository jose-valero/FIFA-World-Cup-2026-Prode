import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { Alert, Button, Card, CardContent, CircularProgress, Grid, Stack, Typography, Chip } from '@mui/material';
import * as React from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { routes } from '../../../app/router/routes';
import { PageHeader } from '../../../shared/components/PageHeader';
import { TeamFlag } from '../../../shared/components/TeamFlag';
import { TeamPlayerDrawer } from '../components/TeamPlayerDrawer';
import { TeamPlayersList } from '../components/TeamPlayersList';
import { useTeamDetail } from '../hooks/useTeamDetail';
import type { TeamPlayer } from '../types/teams.types';

export function TeamDetailPage() {
  const { teamId } = useParams();
  const { data, isLoading, isError, error } = useTeamDetail(teamId);

  const [selectedPlayer, setSelectedPlayer] = React.useState<TeamPlayer | null>(null);

  const handleOpenPlayer = React.useCallback((player: TeamPlayer) => {
    setSelectedPlayer(player);
  }, []);

  const handleClosePlayer = React.useCallback(() => {
    setSelectedPlayer(null);
  }, []);

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

  const infoCards = [
    {
      key: 'squad',
      icon: <GroupsRoundedIcon fontSize='small' />,
      title: 'Plantilla',
      value: `${data.players.length} jugadores`
    }
  ].filter((item) => Boolean(item.value));

  return (
    <>
      <Stack spacing={2.5}>
        <PageHeader
          title={data.name}
          description='Ficha del equipo y plantilla actual.'
          actions={
            <Button component={RouterLink} to={routes.teams} startIcon={<ArrowBackRoundedIcon />}>
              Volver a equipos
            </Button>
          }
        />

        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
            <Stack spacing={3}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <Stack
                  sx={{
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: 'divider',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    flexShrink: 0
                  }}
                >
                  <TeamFlag teamCode={data.flagCode ?? data.code} teamName={data.country ?? data.name} size={45} />
                </Stack>

                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Typography variant='h4' fontWeight={900}>
                    {data.name}
                  </Typography>

                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    {data.code ? <Chip label={data.code} size='small' variant='outlined' /> : null}
                    {data.group ? (
                      <Chip label={`Grupo ${data.group}`} size='small' color='secondary' variant='outlined' />
                    ) : null}
                    {data.confederation.label ? (
                      <Chip label={data.confederation.label} size='small' color='primary' variant='outlined' />
                    ) : null}
                  </Stack>
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                {infoCards.map((item) => (
                  <Grid key={item.key} size={{ xs: 12, md: 6, xl: 4 }}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        height: '100%'
                      }}
                    >
                      <CardContent>
                        <Stack spacing={1}>
                          <Stack direction='row' spacing={1} alignItems='center'>
                            {item.icon}
                            <Typography fontWeight={700}>{item.title}</Typography>
                          </Stack>
                          <Typography color='text.secondary'>{item.value}</Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={1}>
          <Typography variant='h5' fontWeight={900}>
            Plantilla
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Toca un jugador para ver más información.
          </Typography>
          <TeamPlayersList players={data.players} onSelectPlayer={handleOpenPlayer} />
        </Stack>
      </Stack>

      <TeamPlayerDrawer player={selectedPlayer} open={Boolean(selectedPlayer)} onClose={handleClosePlayer} />
    </>
  );
}
