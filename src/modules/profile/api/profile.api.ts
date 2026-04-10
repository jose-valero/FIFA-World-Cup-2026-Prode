import { supabase } from '../../../lib/supabase/client';

export const AVATAR_BUCKET = 'avatars';
export const MAX_AVATAR_FILE_SIZE_BYTES = 1_000_000;
export const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'] as const;

const MIME_EXTENSION_MAP: Record<(typeof ALLOWED_AVATAR_MIME_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/jpg': 'jpeg'
};

export function validateAvatarFile(file: File) {
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return 'Solo puedes subir imágenes JPG, PNG o WEBP.';
  }

  if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
    return 'La imagen no puede pesar más de 1 MB.';
  }

  return null;
}

function buildAvatarPath(userId: string, file: File) {
  const extension = MIME_EXTENSION_MAP[file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]] ?? 'jpg';
  return `${userId}/avatar.${extension}`;
}

export async function uploadAvatarAndSaveProfile(params: { userId: string; file: File }) {
  const { userId, file } = params;

  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const avatarPath = buildAvatarPath(userId, file);

  const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(avatarPath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(avatarPath);
  const avatarUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: avatarUrl,
      avatar_path: avatarPath
    })
    .eq('id', userId);

  if (updateError) {
    throw updateError;
  }

  return { avatarUrl, avatarPath };
}

export async function removeAvatarFromProfile(params: { profileId: string; avatarPath?: string | null }) {
  const { profileId, avatarPath } = params;

  if (avatarPath) {
    const { error: removeError } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);

    if (removeError) {
      throw removeError;
    }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      avatar_url: null,
      avatar_path: null
    })
    .eq('id', profileId);

  if (updateError) {
    throw updateError;
  }
}
