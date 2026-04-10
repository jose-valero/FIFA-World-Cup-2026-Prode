import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

type PersonalInfoSectionProps = {
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
  isDisabled: boolean;
  readonly?: boolean;
  isSubmitting?: boolean;
  isRemoving?: boolean;
  onAvatarChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar?: () => void;
};

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

export function PersonalInfoSection({
  displayName,
  email,
  avatarUrl,
  createdAt,
  isDisabled,
  readonly = false,
  isSubmitting = false,
  isRemoving = false,
  onAvatarChange,
  onRemoveAvatar
}: PersonalInfoSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 2.5 }}>
        <Typography variant='subtitle1' fontWeight={800}>
          Información personal
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Tu nombre, foto y estado de cuenta.
        </Typography>
      </Stack>

      <Stack spacing={3} alignItems='center'>
        <Avatar
          src={avatarUrl ?? undefined}
          sx={{
            width: 100,
            height: 100,
            fontSize: 36,
            fontWeight: 800
          }}
        >
          {getInitial(displayName)}
        </Avatar>

        <Box textAlign='center'>
          <Typography variant='h6' fontWeight={800}>
            {displayName}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {email}
          </Typography>
        </Box>

        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap justifyContent='center'>
          <Chip
            label={isDisabled ? 'Cuenta deshabilitada' : 'Cuenta habilitada'}
            size='small'
            color={isDisabled ? 'default' : 'success'}
            variant={isDisabled ? 'outlined' : 'filled'}
          />
          <Typography variant='body2' color='text.secondary'>
            Miembro desde: {formatDate(createdAt)}
          </Typography>
        </Stack>

        {!readonly ? (
        <Stack spacing={1} alignItems='center'>
          <Typography variant='caption' color='text.secondary'>
            Formatos permitidos: JPG, PNG, WEBP · Máximo 1 MB
          </Typography>

          <Button component='label' variant='contained' size='small' disabled={isSubmitting || isRemoving}>
            {isSubmitting ? (
              <Stack direction='row' spacing={1} alignItems='center'>
                <CircularProgress size={16} color='inherit' />
                <span>Subiendo...</span>
              </Stack>
            ) : (
              'Subir nueva foto'
            )}
            <input hidden type='file' accept='image/png,image/jpeg,image/webp' onChange={onAvatarChange} />
          </Button>

          <Button
            variant='text'
            color='inherit'
            size='small'
            disabled={!avatarUrl || isSubmitting || isRemoving}
            onClick={onRemoveAvatar}
          >
            {isRemoving ? 'Eliminando...' : 'Eliminar foto actual'}
          </Button>
        </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
