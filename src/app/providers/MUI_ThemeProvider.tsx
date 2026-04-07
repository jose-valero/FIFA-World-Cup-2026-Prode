import { type ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { appTheme } from '../../styles/theme';

export const MUI_ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
