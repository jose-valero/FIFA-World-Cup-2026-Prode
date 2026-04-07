import { Card } from '@mui/material';
import { type ReactNode } from 'react';

export const AuthCardWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <Card
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      {children}
    </Card>
  );
};
