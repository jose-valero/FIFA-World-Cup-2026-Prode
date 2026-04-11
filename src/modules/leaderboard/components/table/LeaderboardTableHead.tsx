import { TableCell, TableHead, TableRow, Typography } from '@mui/material';

interface LeaderboardTableHeadProps {
  canInspectPredictions: boolean;
  isAdmin: boolean;
}

export const LeaderboardTableHead = ({ canInspectPredictions, isAdmin }: LeaderboardTableHeadProps) => {
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
            Aciertos de signo
          </Typography>
        </TableCell>

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Partidos evaluados
          </Typography>
        </TableCell>

        {canInspectPredictions ? (
          <TableCell align='right'>
            <Typography variant='body2' fontWeight={700}>
              Pronósticos
            </Typography>
          </TableCell>
        ) : null}

        {isAdmin ? (
          <TableCell align='right'>
            <Typography variant='body2' fontWeight={700}>
              Cuenta
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

        <TableCell align='right'>
          <Typography variant='body2' fontWeight={700}>
            Estado
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};
