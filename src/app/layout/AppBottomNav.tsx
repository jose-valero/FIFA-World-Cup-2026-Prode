import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { routes } from '../router/routes';

import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';

type NavItemDef = {
  label: string;
  icon: React.ReactNode;
  to: string;
  matchBase?: string;
};

const ENABLED_ITEMS: NavItemDef[] = [
  { label: 'Dashboard', to: routes.dashboard, icon: <HomeRoundedIcon /> },
  { label: 'Ranking', to: routes.leaderboard, icon: <EmojiEventsRoundedIcon /> },
  {
    label: 'Pronósticos',
    to: routes.predictionMatches,
    matchBase: routes.predictions,
    icon: <EditRoundedIcon />
  },
  { label: 'Fixture', to: routes.fixture, icon: <CalendarMonthRoundedIcon /> },
  { label: 'Perfil', to: routes.profile, icon: <PersonRoundedIcon /> }
];

const DISABLED_ITEMS: NavItemDef[] = [
  { label: 'Fixture', to: routes.fixture, icon: <CalendarMonthRoundedIcon /> },
  { label: 'Perfil', to: routes.profile, icon: <PersonRoundedIcon /> }
];

export function AppBottomNav() {
  const { user, profile } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isDisabled = Boolean(profile?.is_disabled);
  const items = isDisabled ? DISABLED_ITEMS : ENABLED_ITEMS;

  const currentIndex = items.findIndex((item) => {
    const base = item.matchBase ?? item.to;
    return pathname === base || pathname.startsWith(base + '/');
  });

  return (
    <Paper
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: { xs: 'block', sm: 'none' },
        borderTop: '1px solid',
        borderColor: 'divider',
        zIndex: 1200,
        pb: 'env(safe-area-inset-bottom)',
        bgcolor: 'background.paper'
      }}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : false}
        onChange={(_, newValue: number) => {
          navigate(items[newValue].to);
        }}
        showLabels
        sx={{
          bgcolor: 'transparent',
          height: 56,
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            minWidth: 0,
            px: 0.5,
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.6rem',
              fontWeight: 600,
              letterSpacing: 0.3,
              mt: 0.25
            }
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: 'primary.main'
          }
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
