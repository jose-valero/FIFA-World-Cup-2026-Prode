import * as React from 'react';
import { Alert, Box, CardContent, Divider, Link as MuiLink, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { BrandLogo } from '../../../assets/brand/BrandLogo';
import { GoogleButton } from '../components/GoogleButton';
import { CTAButton } from '../components/CTAButton';
import { AuthCardWrapper } from '../components/AuthCardWrapper';
import { routes } from '../../../app/router/routes';

export function LoginPage() {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/app';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signInWithEmail({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await signInWithGoogle(redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Google';
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
                Iniciar sesión
              </Typography>

              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                Entra a tu cuenta para cargar tus pronósticos y seguir tu posición en la tabla global.
              </Typography>
            </Box>

            {errorMessage ? <Alert severity='error'>{errorMessage}</Alert> : null}

            <Stack spacing={2}>
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
            </Stack>

            <CTAButton isSubmitting={isSubmitting} ctaText='Ingresar' />

            <Divider>o</Divider>

            <GoogleButton isSubmitting={isSubmitting} onSubmit={handleGoogleSignIn} />

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              justifyContent='space-between'
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <MuiLink component={RouterLink} to={routes.register} underline='hover'>
                ¿No tienes cuenta? Regístrate
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
