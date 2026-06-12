import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { AppUpdateScreen } from '../../shared/components/AppUpdateScreen';
import { isChunkLoadError, hasReloadBeenAttempted, performRecoveryReload } from '../../shared/utils/chunkErrors';

export function RouterErrorPage() {
  const error = useRouteError();
  const isChunk = isChunkLoadError(error);
  const retried = hasReloadBeenAttempted();

  useEffect(() => {
    if (isChunk && !retried) {
      performRecoveryReload();
    }
  }, [isChunk, retried]);

  // If about to auto-reload, show nothing to avoid a flash of the recovery screen.
  if (isChunk && !retried) return null;

  return <AppUpdateScreen alreadyRetried={retried || !isChunk} />;
}
