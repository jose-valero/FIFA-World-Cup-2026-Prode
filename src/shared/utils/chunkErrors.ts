const RELOAD_TS_KEY = 'quiniela_chunk_reload_ts';
const COOLDOWN_MS = 30_000; // 30 s — prevents infinite reload loops

export function isChunkLoadError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : error !== null && typeof error === 'object' && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : '';

  const lower = msg.toLowerCase();
  return (
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('text/html is not a valid javascript mime type') ||
    lower.includes('dynamically imported module') ||
    (error instanceof Error && error.name === 'ChunkLoadError')
  );
}

export function hasReloadBeenAttempted(): boolean {
  const raw = sessionStorage.getItem(RELOAD_TS_KEY);
  if (!raw) return false;
  return Date.now() - parseInt(raw, 10) < COOLDOWN_MS;
}

// Replace (not reload) to force fresh HTML + new asset hashes from the CDN.
export function performRecoveryReload(): void {
  sessionStorage.setItem(RELOAD_TS_KEY, String(Date.now()));
  window.location.replace(
    window.location.pathname + window.location.search + window.location.hash
  );
}
