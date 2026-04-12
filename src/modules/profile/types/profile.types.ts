export type Profile = {
  id: string;
  display_name: string | null;
  is_admin: boolean;
  is_disabled: boolean;
  avatar_url: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};
