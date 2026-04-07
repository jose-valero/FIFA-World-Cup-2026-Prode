import { Container as MUIContainer, type Breakpoint, type SxProps } from '@mui/material';
import React from 'react';

export const AppContainer = ({
  children,
  size = 'xl',
  sx = { py: { xs: 3, sm: 4, md: 5 } }
}: {
  children: React.ReactNode;
  size?: Breakpoint;
  sx?: SxProps;
}) => {
  return (
    <MUIContainer maxWidth={size} sx={sx}>
      {children}
    </MUIContainer>
  );
};
