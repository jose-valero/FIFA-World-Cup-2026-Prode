import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../../profile/types/profile.types';

export type AuthContextValueSchema = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUpWithEmail: (params: { email: string; password: string; displayName: string }) => Promise<void>;
  signInWithEmail: (params: { email: string; password: string }) => Promise<void>;
  signInWithGoogle: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export type UseAuthValueSchema = AuthContextValueSchema & {
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
};
