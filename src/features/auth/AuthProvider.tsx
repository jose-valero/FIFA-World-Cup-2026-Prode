import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { AuthContextValueSchema, AuthProfile } from './auth.types';
import { getMyProfile } from './auth.api';

const AuthContext = React.createContext<AuthContextValueSchema | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [profile, setProfile] = React.useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const clearAuthState = () => {
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setProfile(null);
    };

    const syncAuthState = async (nextSession: Session | null) => {
      if (!mounted) return;

      const nextUser = nextSession?.user ?? null;

      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser?.id) {
        setProfile(null);
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const nextProfile = await getMyProfile(nextUser.id);

        if (!mounted) return;

        setProfile(nextProfile);
      } catch (error) {
        console.error('Error cargando perfil:', error);

        if (!mounted) return;

        setProfile(null);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obteniendo sesión:', error.message);
          clearAuthState();
          return;
        }

        await syncAuthState(data.session ?? null);
      } catch (error) {
        console.error('Error inicializando auth:', error);
        clearAuthState();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncAuthState(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithEmail = React.useCallback(
    async ({ email, password, displayName }: { email: string; password: string; displayName: string }) => {
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
    },
    []
  );

  const signInWithEmail = React.useCallback(async ({ email, password }: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }
  }, []);

  const signInWithGoogle = React.useCallback(async (next = '/app') => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    // const redirectTo = import.meta.env.VITE_SUPABASE_GOOGLE_REDIRECT_URL || window.location.origin;
    const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error en signOut:', error);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      session,
      profile,
      isLoading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut
    }),
    [user, session, profile, isLoading, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider');
  }

  return context;
}
