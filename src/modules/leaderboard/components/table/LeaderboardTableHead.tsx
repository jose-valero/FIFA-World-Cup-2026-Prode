import { TableCell, TableHead, TableRow, Typography, useMediaQuery, useTheme } from '@mui/material';

interface LeaderboardTableHeadProps {
  canInspectPredictions: boolean;
  isAdmin: boolean;
}

export const LeaderboardTableHead = ({ canInspectPredictions, isAdmin }: LeaderboardTableHeadProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <TableHead>
      <TableRow>
        <TableCell>#</TableCell>

        <TableCell>
          <Typography variant='body2' fontWeight={700}>
            Participante
          </Typography>
        </TableCell>

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Puntos
          </Typography>
        </TableCell>

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Exactos
          </Typography>
        </TableCell>

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Aciertos
          </Typography>
        </TableCell>

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Evaluados
          </Typography>
        </TableCell>

        {canInspectPredictions && !isMobile ? (
          <TableCell align='right'>
            <Typography variant='body2' fontWeight={700}>
              Pronósticos
            </Typography>
          </TableCell>
        ) : null}

        {isAdmin ? (
          <TableCell align='right'>
            <Typography variant='body2' fontWeight={700}>
              Acción
            </Typography>
          </TableCell>
        ) : null}
      </TableRow>
    </TableHead>
  );
};
