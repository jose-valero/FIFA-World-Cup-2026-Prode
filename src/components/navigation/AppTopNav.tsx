import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import { NavLink, useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/useAuth';
import { BrandLogo } from '../../assets/brand/BrandLogo';
import { AppContainer } from '../layout/AppContainer';
import { useAppSettings } from '../../features/settings/useAppSettings';

type NavItem = {
  label: string;
  to: string;
};

function getDisplayName(user: any) {
  const metadataName = user?.user_metadata?.display_name || user?.user_metadata?.displayName;

  if (metadataName && typeof metadataName === 'string') {
    return metadataName;
  }

  if (user?.email && typeof user.email === 'string') {
    return user.email.split('@')[0];
  }

  return 'Usuario';
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'U';
}

export default function AppTopNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: settings = null } = useAppSettings();
  const showAuditLink = settings?.audits_visible ?? false;

  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(profile?.is_admin);
  const displayName = getDisplayName(user);

  const publicNavItems: NavItem[] = [
    { label: 'Inicio', to: '/' },
    { label: 'Ranking', to: '/ranking' }
  ];

  const privateNavItems: NavItem[] = [
    { label: 'Inicio', to: '/' },
    { label: 'Ranking', to: '/ranking' },
    { label: 'Carga tu pronóstico', to: '/app/predictions/matches' },
    { label: 'Fixture', to: '/app/fixture' },
    { label: 'Dashboard', to: '/app/dashboard' },
    ...(showAuditLink ? [{ label: 'Auditorías', to: '/app/audits' }] : [])
  ];

  const navItems = isAuthenticated ? privateNavItems : publicNavItems;

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    handleCloseUserMenu();

    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <AppBar position='sticky' color='transparent' elevation={0}>
      <AppContainer sx={{ marginY: 1 }}>
        <Toolbar disableGutters sx={{ minHeight: 64 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexGrow: { xs: 1, md: 0 }
            }}
          >
            <NavLink
              to='/'
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <BrandLogo />
            </NavLink>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
          {/* a<sd */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size='large'
              aria-label='abrir menú de navegación'
              aria-controls='main-navigation-menu'
              aria-haspopup='true'
              onClick={handleOpenNavMenu}
              color='inherit'
            >
              <MenuIcon />
            </IconButton>

            <Menu
              id='main-navigation-menu'
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {navItems.map((item) => (
                <MenuItem key={item.label} component={NavLink} to={item.to} onClick={handleCloseNavMenu}>
                  <Typography textAlign='center'>{item.label}</Typography>
                </MenuItem>
              ))}

              {!isAuthenticated ? (
                <div>
                  <Divider sx={{ my: 0 }} />
                  <MenuItem component={NavLink} to='/login' onClick={handleCloseNavMenu}>
                    <Typography>Login</Typography>
                  </MenuItem>
                  <MenuItem component={NavLink} to='/register' onClick={handleCloseNavMenu}>
                    <Typography fontWeight={700}>Registrarse</Typography>
                  </MenuItem>
                </div>
              ) : (
                <div>
                  <Divider sx={{ my: 0 }} />
                  <MenuItem component={NavLink} to='/app/mis-pronosticos' onClick={handleCloseNavMenu}>
                    <Typography>Mis pronósticos</Typography>
                  </MenuItem>

                  {isAdmin ? (
                    <>
                      <Divider sx={{ my: 0 }} />
                      <MenuItem component={NavLink} to='/admin/results' onClick={handleCloseNavMenu}>
                        <Typography>Admin · Resultados</Typography>
                      </MenuItem>
                      <MenuItem component={NavLink} to='/admin/matches' onClick={handleCloseNavMenu}>
                        <Typography>Admin · Partidos</Typography>
                      </MenuItem>
                      <MenuItem component={NavLink} to='/admin/settings' onClick={handleCloseNavMenu}>
                        <Typography>Admin · Configuración</Typography>
                      </MenuItem>
                    </>
                  ) : null}

                  <Divider sx={{ my: 0 }} />
                  <MenuItem onClick={handleLogout}>
                    <Typography fontWeight={700}>Cerrar sesión</Typography>
                  </MenuItem>
                </div>
              )}
            </Menu>
          </Box>
          {/* asd */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                component={NavLink}
                to={item.to}
                color='inherit'
                onClick={handleCloseNavMenu}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600
                }}
              >
                {item.label}
              </Button>
            ))}

            {!isAuthenticated ? (
              <>
                <Button
                  component={NavLink}
                  to='/login'
                  color='inherit'
                  sx={{
                    ml: 1,
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 600
                  }}
                >
                  Login
                </Button>

                <Button
                  component={NavLink}
                  to='/register'
                  variant='contained'
                  sx={{
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    fontWeight: 700
                  }}
                >
                  Registrarse
                </Button>
              </>
            ) : (
              <>
                <Typography variant='body2' color='text.secondary' sx={{ ml: 1, mr: 0.5, maxWidth: 180 }} noWrap>
                  {displayName}
                </Typography>

                <Tooltip title='Opciones de cuenta'>
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: 14,
                        fontWeight: 700
                      }}
                    >
                      {getInitial(displayName)}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  sx={{ mt: '45px' }}
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  <MenuItem component={NavLink} to='/app/dashboard' onClick={handleCloseUserMenu}>
                    Dashboard
                  </MenuItem>

                  <MenuItem component={NavLink} to='/app/mis-pronosticos' onClick={handleCloseUserMenu}>
                    Mis pronósticos
                  </MenuItem>

                  {isAdmin ? <Divider sx={{ my: 0 }} /> : null}

                  {isAdmin ? (
                    <MenuItem component={NavLink} to='/admin/results' onClick={handleCloseUserMenu}>
                      Admin · Resultados
                    </MenuItem>
                  ) : null}

                  {isAdmin ? (
                    <MenuItem component={NavLink} to='/admin/matches' onClick={handleCloseUserMenu}>
                      Admin · Partidos
                    </MenuItem>
                  ) : null}

                  {isAdmin ? (
                    <MenuItem component={NavLink} to='/admin/settings' onClick={handleCloseUserMenu}>
                      Admin · Configuración
                    </MenuItem>
                  ) : null}

                  <Divider sx={{ my: 0 }} />
                  <MenuItem onClick={handleLogout}>Cerrar sesión</MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </Toolbar>
      </AppContainer>
    </AppBar>
  );
}
