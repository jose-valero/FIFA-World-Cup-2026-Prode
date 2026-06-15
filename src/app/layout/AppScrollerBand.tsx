import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { useMatches } from '../../modules/matches/hooks/useMatches';
import { TodayMatchesScroller } from '../../modules/dashboard/components/TodayMatchesScroller';
import { getSportsDayKey } from '../../shared/utils/getSportsDayKey';
import { AppContainer } from './AppContainer';

export function AppScrollerBand() {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const { data: matches = [] } = useMatches();

  const isDisabled = Boolean(profile?.is_disabled);
  const isAdminRoute = pathname.startsWith('/admin');
  const shouldRender = Boolean(user) && !isDisabled && !isAdminRoute;

  const todayMatches = React.useMemo(() => {
    if (!shouldRender) return [];
    const todayKey = getSportsDayKey(new Date());
    return matches.filter(
      (m) => m.status === 'live' || getSportsDayKey(new Date(m.kickoffAt)) === todayKey
    );
  }, [matches, shouldRender]);

  if (!shouldRender || todayMatches.length === 0) return null;

  return (
    <Box
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 0.75,
        bgcolor: 'background.paper'
      }}
    >
      <AppContainer sx={{ py: 0 }}>
        <TodayMatchesScroller matches={todayMatches} />
      </AppContainer>
    </Box>
  );
}
