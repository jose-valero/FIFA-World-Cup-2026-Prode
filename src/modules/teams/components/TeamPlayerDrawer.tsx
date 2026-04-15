import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Alert, Avatar, Chip, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router';
import { useTeamPlayerDetail } from '../hooks/useTeamPlayerDetail';
import type { TeamPlayer } from '../types/teams.types';

type TeamPlayerDrawerProps = {
  player: TeamPlayer | null;
  open: boolean;
  onClose: () => void;
};

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function TeamPlayerDrawer({ player, open, onClose }: TeamPlayerDrawerProps) {
  const { teamId } = useParams();

  const { data, isLoading, isError, error } = useTeamPlayerDetail(teamId, player?.id, open && Boolean(player?.id));

  const detail = data ?? null;
  const fallbackName = player?.name ?? 'Jugador';

  return (
    <Drawer anchor='right' open={open} onClose={onClose}>
      <Stack
        sx={{
          width: { xs: '100vw', sm: 420 },
          maxWidth: '100%'
        }}
      >
        <Stack direction='row' alignItems='center' justifyContent='space-between' sx={{ px: 2, py: 1.5 }}>
          <Typography variant='h6' fontWeight={900}>
            Detalle del jugador
          </Typography>

          <IconButton onClick={onClose} aria-label='Cerrar'>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider />

        {!player ? (
          <Stack sx={{ p: 3 }}>
            <Typography color='text.secondary'>No se encontró información del jugador.</Typography>
          </Stack>
        ) : isLoading ? (
          <Stack alignItems='center' sx={{ p: 4 }}>
            <CircularProgress />
          </Stack>
        ) : isError ? (
          <Stack sx={{ p: 3 }}>
            <Alert severity='error'>{error instanceof Error ? error.message : 'No se pudo cargar el jugador'}</Alert>
          </Stack>
        ) : (
          <Stack spacing={3} sx={{ p: 3 }}>
            <Stack spacing={2} alignItems='center'>
              <Avatar
                src={detail?.photoUrl ?? player.photoUrl ?? undefined}
                alt={detail?.displayName ?? detail?.name ?? fallbackName}
                sx={{ width: 112, height: 112 }}
              >
                {buildInitials(detail?.displayName ?? detail?.name ?? fallbackName)}
              </Avatar>

              <Stack spacing={1} alignItems='center'>
                <Typography variant='h5' fontWeight={900} textAlign='center'>
                  {detail?.displayName ?? detail?.name ?? fallbackName}
                </Typography>

                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap justifyContent='center'>
                  {(detail?.position ?? player.position) ? (
                    <Chip label={detail?.position ?? player.position} variant='outlined' />
                  ) : null}
                  {(detail?.number ?? player.number) ? (
                    <Chip label={`#${detail?.number ?? player.number}`} variant='outlined' />
                  ) : null}
                  {(detail?.age ?? player.age) ? (
                    <Chip label={`${detail?.age ?? player.age} años`} variant='outlined' />
                  ) : null}
                </Stack>
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.25}>
              <Typography fontWeight={700}>Nombre</Typography>
              <Typography color='text.secondary'>{detail?.name ?? fallbackName}</Typography>

              <Typography fontWeight={700}>Lugar de nacimiento</Typography>
              <Typography color='text.secondary'>{detail?.birthPlace ?? '—'}</Typography>

              <Typography fontWeight={700}>Fecha de nacimiento</Typography>
              <Typography color='text.secondary'>{detail?.birthDate ?? '—'}</Typography>

              <Typography fontWeight={700}>Altura</Typography>
              <Typography color='text.secondary'>{detail?.height ?? '—'}</Typography>

              <Typography fontWeight={700}>Peso</Typography>
              <Typography color='text.secondary'>{detail?.weight ?? '—'}</Typography>

              <Typography fontWeight={700}>Proveedor</Typography>
              <Typography color='text.secondary'>{detail?.provider ?? 'espn'}</Typography>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}
