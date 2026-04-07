import * as React from 'react';
import { Box, Card, CardContent, Chip, Collapse, IconButton, Stack, Typography, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type PageFiltersBarProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  activeCount?: number;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function PageFiltersBar({
  title = 'Filtros',
  description,
  activeCount = 0,
  defaultExpanded = true,
  collapsible = true,
  actions,
  children
}: PageFiltersBarProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const handleToggle = () => {
    if (!collapsible) return;
    setExpanded((prev) => !prev);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction='row' spacing={1.5} justifyContent='space-between' alignItems='center'>
            <Stack spacing={0.5} sx={{ minWidth: 0 }}>
              <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                <Typography variant='h5' fontWeight={800}>
                  {title}
                </Typography>

                {activeCount > 0 ? (
                  <Chip label={`${activeCount} activos`} size='small' color='primary' variant='outlined' />
                ) : null}
              </Stack>

              {description ? (
                <Typography variant='body2' color='text.secondary'>
                  {description}
                </Typography>
              ) : null}
            </Stack>

            <Stack direction='row' spacing={1} alignItems='center'>
              {actions ? <Box>{actions}</Box> : null}

              {collapsible ? (
                <IconButton
                  onClick={handleToggle}
                  size='small'
                  sx={(theme) => ({
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.background.paper, 0.4)
                  })}
                >
                  <ExpandMoreIcon
                    sx={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 180ms ease'
                    }}
                  />
                </IconButton>
              ) : null}
            </Stack>
          </Stack>

          {collapsible ? <Collapse in={expanded}>{children}</Collapse> : <Box>{children}</Box>}
        </Stack>
      </CardContent>
    </Card>
  );
}
