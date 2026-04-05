import { createTheme, alpha } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7CFF4F',
      light: '#A1FF7A',
      dark: '#4FD12A',
      contrastText: '#08110A'
    },
    secondary: {
      main: '#3EA6FF',
      light: '#6BBCFF',
      dark: '#1F7FD1',
      contrastText: '#06111B'
    },
    background: {
      default: '#0B0F14',
      paper: '#121821'
    },
    text: {
      primary: '#E8EDF2',
      secondary: '#A7B1BC'
    },
    divider: alpha('#FFFFFF', 0.08),
    success: {
      main: '#39D98A',
      light: '#62E6A5',
      dark: '#1FAA68',
      contrastText: '#04110B'
    },
    warning: {
      main: '#FFB547',
      light: '#FFC876',
      dark: '#D99022',
      contrastText: '#1A1205'
    },
    error: {
      main: '#FF5C7A',
      light: '#FF7F97',
      dark: '#D93A58',
      contrastText: '#19070B'
    },
    info: {
      main: '#4DB8FF',
      light: '#79CBFF',
      dark: '#238DCC',
      contrastText: '#06131C'
    }
  },

  shape: {
    borderRadius: 14
  },

  typography: {
    fontFamily: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'].join(','),
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      fontWeight: 700,
      textTransform: 'none'
    }
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(circle at top, #121A24 0%, #0B0F14 45%, #080B10 100%)',
          backgroundAttachment: 'fixed'
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121821',
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`
        }
      }
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#121821', 0.92),
          border: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          boxShadow: '0 10px 30px rgba(0,0,0,0.28)'
        }
      }
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha('#0F141C', 0.82),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${alpha('#FFFFFF', 0.06)}`,
          boxShadow: 'none'
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          fontWeight: 700
        },
        containedPrimary: {
          boxShadow: '0 8px 24px rgba(124,255,79,0.22)'
        }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10
        }
      }
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#FFFFFF', 0.02),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#FFFFFF', 0.1)
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha('#7CFF4F', 0.35)
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#7CFF4F'
          }
        },
        input: {
          color: '#E8EDF2',
          caretColor: '#E8EDF2',
          borderRadius: 'inherit',
          '&:-webkit-autofill': {
            WebkitTextFillColor: '#E8EDF2',
            WebkitBoxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            boxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            caretColor: '#E8EDF2',
            borderRadius: 'inherit',
            transition: 'background-color 9999s ease-in-out 0s'
          },
          '&:-webkit-autofill:hover': {
            WebkitTextFillColor: '#E8EDF2',
            WebkitBoxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            boxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            caretColor: '#E8EDF2',
            borderRadius: 'inherit'
          },
          '&:-webkit-autofill:focus': {
            WebkitTextFillColor: '#E8EDF2',
            WebkitBoxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            boxShadow: `0 0 0 1000px ${alpha('#FFFFFF', 0.02)} inset`,
            caretColor: '#E8EDF2',
            borderRadius: 'inherit'
          }
        }
      }
    },

    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#FFFFFF', 0.08)
        }
      }
    }
  }
});
