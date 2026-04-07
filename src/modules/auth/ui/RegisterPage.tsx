import * as React from 'react';
import { Alert, Box, CardContent, Divider, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { BrandLogo } from '../../../assets/brand/BrandLogo';
import { GoogleButton } from '../components/GoogleButton';
import { CTAButton } from '../components/CTAButton';
import { AuthCardWrapper } from '../components/AuthCardWrapper';
import { routes } from '../../../app/router/routes';

export function RegisterPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!displayName.trim()) {
      setErrorMessage('El nombre o apodo es obligatorio');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('El correo electrónico es obligatorio');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('La contraseña es obligatoria');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUpWithEmail({ email, password, displayName });
      setSuccessMessage('Cuenta creada correctamente.');
      navigate('/login', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo crear la cuenta';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle('/app');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo registrar con Google';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <AuthCardWrapper>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack component='form' spacing={3} onSubmit={handleSubmit}>
            <BrandLogo />
            <Box>
              <Typography variant='h4' fontWeight={800}>
                Crear cuenta
              </Typography>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Regístrate para participar en la quiniela y competir en el ranking global.
              </Typography>
            </Box>

            {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}
            {successMessage ? <Alert severity='success'>{successMessage}</Alert> : null}

            <Stack spacing={2}>
              <TextField
                label='Nombre o apodo (ej: kikense)'
                fullWidth
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />

              <TextField
                label='Correo electrónico'
                type='email'
                fullWidth
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <TextField
                label='Contraseña'
                type='password'
                fullWidth
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <TextField
                label='Confirmar contraseña'
                type='password'
                fullWidth
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </Stack>

            <CTAButton isSubmitting={isSubmitting} />

            <Divider>o</Divider>

            <GoogleButton isSubmitting={isSubmitting} onSubmit={handleGoogleSignIn} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <MuiLink component={RouterLink} to={routes.login} underline='hover'>
                ¿Ya tienes cuenta? Inicia sesión
              </MuiLink>

              <MuiLink component={RouterLink} to={routes.home} underline='hover'>
                Volver al inicio
              </MuiLink>
            </Stack>
          </Stack>
        </CardContent>
      </AuthCardWrapper>
    </Box>
  );
}
