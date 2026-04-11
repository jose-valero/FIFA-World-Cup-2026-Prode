import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useAuth } from '../../auth/hooks/useAuth';
import { removeAvatarFromProfile, uploadAvatarAndSaveProfile, validateAvatarFile } from '../api/profile.api';
import { PersonalInfoSection } from '../components/PersonalInfoSection';
import { AppContainer } from '../../../app/layout/AppContainer';

function getDisplayName(displayName?: string | null, email?: string | null) {
  if (displayName && typeof displayName === 'string') return displayName;
  if (email && typeof email === 'string') return email.split('@')[0];
  return 'Usuario';
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
      <AppContainer>
        <Stack spacing={3}>
          <Box>
            <Typography variant='h4' fontWeight={800} gutterBottom>
              Mi cuenta
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Gestiona tu perfil y consultá tu estado dentro del torneo.
            </Typography>
          </Box>

          {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
          {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}
          <PersonalInfoSection
            displayName={displayName}
            email={user?.email}
            avatarUrl={profile?.avatar_url}
            createdAt={profile?.created_at}
            isDisabled={isDisabled}
            isSubmitting={isSubmitting}
            isRemoving={isRemoving}
            onAvatarChange={handleAvatarChange}
            onRemoveAvatar={handleRemoveAvatar}
          />
        </Stack>
      </AppContainer>
    </Box>
  );
}
