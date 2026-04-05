import { Container as MUIContainer, type Breakpoint } from '@mui/material';
import React from 'react';

export const AppContainer = ({ children, size = 'xl' }: { children: React.ReactNode; size?: Breakpoint }) => {
  return (
    <MUIContainer maxWidth={size} sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
      {children}
    </MUIContainer>
  );
};
