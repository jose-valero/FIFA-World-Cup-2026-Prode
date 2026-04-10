import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValueSchema {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  profile: AuthProfile | null;
  signUpWithEmail: (params: { email: string; password: string; displayName: string }) => Promise<void>;
  signInWithEmail: (params: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export interface AuthProfile {
  id: string;
  display_name: string;
  is_admin: boolean;
  is_disabled: boolean;
  avatar_url?: string | null;
  avatar_path?: string | null;
  created_at?: string;
  updated_at?: string;
}
