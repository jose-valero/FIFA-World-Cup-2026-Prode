import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
  type ChipProps,
  type SxProps,
  type Theme
} from '@mui/material';

export type PageHeaderBadge = {
  key?: string;
  label: React.ReactNode;
  color?: ChipProps['color'];
  variant?: ChipProps['variant'];
};

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  badges?: PageHeaderBadge[];
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
};

export function PageHeader({ title, description, badges = [], actions, tabs, children, sx }: PageHeaderProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        ...sx
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', lg: 'flex-start' }}
          >
            <Box sx={{ minWidth: 0, flex: 1, maxWidth: { lg: '70%' } }}>
              <Typography variant='h4' fontWeight={800}>
                {title}
              </Typography>

              {description ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.75 }}>
                  {description}
                </Typography>
              ) : null}
            </Box>

            {badges.length > 0 || actions ? (
              <Stack
                spacing={1.25}
                alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
                sx={{
                  width: { xs: '100%', lg: 'auto' },
                  flexShrink: 0
                }}
              >
                {badges.length > 0 ? (
                  <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    {badges.map((badge, index) => (
                      <Chip
                        key={badge.key ?? `${String(badge.label)}-${index}`}
                        label={badge.label}
                        color={badge.color ?? 'default'}
                        variant={badge.variant ?? 'outlined'}
                        size='small'
                      />
                    ))}
                  </Stack>
                ) : null}

                {actions ? <Box>{actions}</Box> : null}
              </Stack>
            ) : null}
          </Stack>

          {tabs ? <Box>{tabs}</Box> : null}
          {children ? <Box>{children}</Box> : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
