import * as React from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useAuth } from '../../auth/hooks/useAuth';
import { removeAvatarFromProfile, uploadAvatarAndSaveProfile, validateAvatarFile } from '../api/profile.api';

function getDisplayName(displayName?: string | null, email?: string | null) {
  if (displayName && typeof displayName === 'string') return displayName;
  if (email && typeof email === 'string') return email.split('@')[0];
  return 'Usuario';
}

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || 'U';
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

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const displayName = getDisplayName(profile?.display_name, user?.email ?? null);
  const isDisabled = Boolean(profile?.is_disabled);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';

    if (!file || !user) return;

    const validationError = validateAvatarFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await uploadAvatarAndSaveProfile({ userId: user.id, file });
      await refreshProfile();

      setSuccessMessage('Tu foto de perfil se actualizó correctamente.');
    } catch (error) {
      console.error('Error actualizando avatar:', error);
      setErrorMessage('No pudimos actualizar tu foto de perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    try {
      setIsRemoving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      await removeAvatarFromProfile({
        profileId: user.id,
        avatarPath: profile?.avatar_path
      });

      await refreshProfile();

      setSuccessMessage('Tu foto de perfil se eliminó correctamente.');
    } catch (error) {
      console.error('Error eliminando avatar:', error);
      setErrorMessage('No pudimos eliminar tu foto de perfil.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Box sx={{ py: { xs: 3, md: 4 } }}>
      <Container maxWidth='md'>
        <Stack spacing={3}>
          <Box>
            <Typography variant='h4' fontWeight={800} gutterBottom>
              Mi cuenta
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Gestiona tu foto de perfil y consulta tu estado dentro del torneo.
            </Typography>
          </Box>

          {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: (theme) => `1px solid ${theme.palette.divider}`
            }}
          >
            <Stack spacing={3} alignItems='center'>
              <Avatar
                src={profile?.avatar_url ?? undefined}
                sx={{
                  width: 132,
                  height: 132,
                  fontSize: 44,
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
                  {user?.email}
                </Typography>
              </Box>

              <Stack direction='row' spacing={1}>
                <Chip
                  label={isDisabled ? 'Cuenta deshabilitada' : 'Cuenta habilitada'}
                  size='small'
                  color={isDisabled ? 'default' : 'success'}
                  variant={isDisabled ? 'outlined' : 'filled'}
                />
              </Stack>

              <Typography variant='body2' color='text.secondary'>
                Miembro desde: {formatDate(profile?.created_at)}
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                Formatos permitidos: JPG, PNG, WEBP. Tamaño máximo: 1 MB.
              </Typography>

              <Button component='label' variant='contained' disabled={isSubmitting || isRemoving}>
                {isSubmitting ? (
                  <Stack direction='row' spacing={1} alignItems='center'>
                    <CircularProgress size={18} color='inherit' />
                    <span>Subiendo foto...</span>
                  </Stack>
                ) : (
                  'Subir nueva foto'
                )}

                <input hidden type='file' accept='image/png,image/jpeg,image/webp' onChange={handleAvatarChange} />
              </Button>

              <Button
                variant='text'
                color='inherit'
                size='small'
                disabled={!profile?.avatar_url || isSubmitting || isRemoving}
                onClick={handleRemoveAvatar}
              >
                {isRemoving ? 'Eliminando foto...' : 'Eliminar foto actual'}
              </Button>

              <Divider flexItem />

              <Stack spacing={0.5} alignItems='center'>
                <Typography variant='body2' color='text.secondary'>
                  Estado competitivo
                </Typography>
                <Typography variant='body1' fontWeight={700}>
                  {isDisabled ? 'Fuera de competencia' : 'Activo'}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
