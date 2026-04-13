import { supabase } from '../../../lib/supabase/client';

export async function signUpWithEmail(params: { email: string; password: string; displayName: string }) {
  const { email, password, displayName } = params;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    throw error;
  }
}

export async function signInWithEmail(params: { email: string; password: string }) {
  const { email, password } = params;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }
}

export async function signInWithGoogle(next = '/app') {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo }
  });

  if (error) {
    throw error;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
