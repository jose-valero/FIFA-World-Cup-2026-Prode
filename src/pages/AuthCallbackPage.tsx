import * as React from 'react';
import { Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router';
import { supabase } from '../lib/supabase/client';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/app';

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;

        if (data.session) {
          navigate(next, { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        if (!mounted) return;

        const message = error instanceof Error ? error.message : 'No se pudo completar el inicio de sesión con Google';

        setErrorMessage(message);
      }
    }

    void handleCallback();

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <Stack spacing={2} alignItems='center' justifyContent='center' sx={{ minHeight: '50vh' }}>
      {errorMessage ? (
        <Alert severity='error'>{errorMessage}</Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography color='text.secondary'>Completando inicio de sesión…</Typography>
        </>
      )}
    </Stack>
  );
}
