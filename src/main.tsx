import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './app/providers/AuthProvider';
import { appRouter } from './app/router/appRouter';
import { RQ_Provider } from './app/providers/RQ_Provider';
import { MUI_ThemeProvider } from './app/providers/MUI_ThemeProvider';
import { ChunkErrorBoundary } from './app/providers/ChunkErrorBoundary';
import { isChunkLoadError, hasReloadBeenAttempted, performRecoveryReload } from './shared/utils/chunkErrors';

// Catch async chunk failures that happen outside the React tree
// (e.g. a prefetch or import() that rejects without being caught by a component).
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (isChunkLoadError(event.reason)) {
    event.preventDefault();
    if (!hasReloadBeenAttempted()) {
      performRecoveryReload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MUI_ThemeProvider>
      <ChunkErrorBoundary>
        <RQ_Provider>
          <AuthProvider>
            <RouterProvider router={appRouter} />
          </AuthProvider>
        </RQ_Provider>
      </ChunkErrorBoundary>
    </MUI_ThemeProvider>
  </React.StrictMode>
);
