import * as React from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { AuthContextValueSchema } from '../../modules/auth/types/auth.types';
import { signInWithEmail, signInWithGoogle, signOut, signUpWithEmail } from '../../modules/auth/api/auth.api';

const AuthContext = React.createContext<AuthContextValueSchema | undefined>(undefined);

function isSameSession(current: Session | null, next: Session | null) {
  return current?.access_token === next?.access_token;
}

function isSameUser(current: User | null, next: User | null) {
  return current?.id === next?.id;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const applySession = React.useCallback((nextSession: Session | null) => {
    const nextUser = nextSession?.user ?? null;

    setSession((prev) => (isSameSession(prev, nextSession) ? prev : nextSession));
    setUser((prev) => (isSameUser(prev, nextUser) ? prev : nextUser));
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!mounted) return;
        applySession(data.session ?? null);
      } catch (error) {
        console.error('Error inicializando auth:', error);

        if (!mounted) return;
        applySession(null);
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
      if (!mounted) return;

      applySession(nextSession ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error en signOut:', error);
    } finally {
      setSession(null);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = React.useMemo<AuthContextValueSchema>(
    () => ({
      user,
      session,
      isLoading,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOut: handleSignOut
    }),
    [user, session, isLoading, handleSignOut]
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
