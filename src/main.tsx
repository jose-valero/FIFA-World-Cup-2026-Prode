import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './app/providers/AuthProvider';
import { appRouter } from './app/router/appRouter';
import { RQ_Provider } from './app/providers/RQ_Provider';
import { MUI_ThemeProvider } from './app/providers/MUI_ThemeProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MUI_ThemeProvider>
      <RQ_Provider>
        <AuthProvider>
          <RouterProvider router={appRouter} />
        </AuthProvider>
      </RQ_Provider>
    </MUI_ThemeProvider>
  </React.StrictMode>
);
