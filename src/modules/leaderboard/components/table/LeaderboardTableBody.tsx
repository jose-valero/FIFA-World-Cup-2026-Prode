import React from 'react';
import { alpha, Avatar, Button, Chip, Stack, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { podiumStyle } from '../../styles/atoms';
import { getInitial } from '../../../../shared/utils/getInitial';
import type { LeaderboardTableProps } from '../../types/leaderboard.types';

export const LeaderboardTableBody = ({
  displayRows,
  adminMap,
  activePositionMap,
  user,
  isAdmin,
  canInspectPredictions,
  isAdminOverviewLoading,
  isSetParticipantDisabledPending,
  handleOpenProfile,
  handleOpenParticipantAudit,
  handleToggleParticipantStatus
}: LeaderboardTableProps) => {
  return (
    <TableBody>
      {displayRows.map((row, index) => {
        const previousRow = displayRows[index - 1];
        const startsDisabledSection = row.is_disabled && !previousRow?.is_disabled;

        const adminRow = adminMap.get(row.user_id);
        const isDisabledRow = Boolean(row.is_disabled);
        const position = isDisabledRow ? null : (activePositionMap.get(row.user_id) ?? null);
        const isCurrentUser = Boolean(user?.id && row.user_id === user.id);

        return (
          <React.Fragment key={row.user_id}>
            {startsDisabledSection ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : canInspectPredictions ? 8 : 7} align='center'>
                  <Typography variant='body2' color='text.secondary' sx={{ px: 2, py: 1.5, fontWeight: 700 }}>
                    Participantes deshabilitados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}

            <TableRow
              hover
              sx={(theme) => ({
                opacity: isDisabledRow ? 0.58 : 1,
                bgcolor: isCurrentUser
                  ? alpha(theme.palette.info.main, 0.08)
                  : isDisabledRow
                    ? alpha(theme.palette.action.disabledBackground, 0.45)
                    : undefined,
                '& td': {
                  color: isDisabledRow ? theme.palette.text.disabled : undefined
                },
                '& td:first-of-type': {
                  borderLeft: '4px solid',
                  borderLeftColor: isDisabledRow
                    ? theme.palette.action.disabled
                    : ((position ? podiumStyle(position)?.border : null) ?? 'transparent'),
                  pl: 1.5
                }
              })}
            >
              <TableCell>
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                  {position ? (
                    <Typography fontWeight={800}>#{position}</Typography>
                  ) : (
                    <Typography fontWeight={800}>—</Typography>
                  )}

                  {isCurrentUser ? <Chip label='Tú' size='small' variant='outlined' /> : null}
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction='row' spacing={1.5} alignItems='center'>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: 14,
                      fontWeight: 800
                    }}
                  >
                    {getInitial(row.display_name)}
                  </Avatar>

                  <Typography
                    onClick={() => handleOpenProfile(row)}
                    fontWeight={isCurrentUser ? 800 : 700}
                    sx={{
                      cursor: 'pointer',
                      maxWidth: { xs: 120, sm: 220 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {row.display_name}
                  </Typography>
                </Stack>
              </TableCell>

              <TableCell align='right'>
                <Chip
                  label={`${row.total_points} pts`}
                  color={position === 1 ? 'primary' : 'default'}
                  variant={position === 1 ? 'filled' : 'outlined'}
                  size='small'
                />
              </TableCell>

              <TableCell align='right'>{row.exact_hits}</TableCell>
              <TableCell align='right'>{row.outcome_hits}</TableCell>
              <TableCell align='right'>{row.scored_predictions}</TableCell>

              {canInspectPredictions ? (
                <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                  <Button size='small' variant='outlined' onClick={() => handleOpenParticipantAudit(row)}>
                    Ver pronósticos
                  </Button>
                </TableCell>
              ) : null}

              {isAdmin ? (
                <TableCell align='right'>
                  {isAdminOverviewLoading ? (
                    <Chip label='Cargando...' size='small' variant='outlined' />
                  ) : adminRow ? (
                    <Chip
                      label={adminRow.email_confirmed ? 'Verificada' : 'Pendiente'}
                      size='small'
                      color={adminRow.email_confirmed ? 'success' : 'warning'}
                      variant='outlined'
                    />
                  ) : (
                    '—'
                  )}
                </TableCell>
              ) : null}

              {isAdmin ? (
                <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                  {adminRow?.user_id === user?.id ? (
                    <Chip label='Admin' size='small' variant='outlined' />
                  ) : (
                    <Button
                      size='small'
                      variant='outlined'
                      color={row.is_disabled ? 'success' : 'warning'}
                      disabled={isSetParticipantDisabledPending}
                      onClick={() => handleToggleParticipantStatus(row)}
                    >
                      {row.is_disabled ? 'Habilitar' : 'Deshabilitar'}
                    </Button>
                  )}
                </TableCell>
              ) : null}

              <TableCell align='right'>
                {row.is_disabled ? (
                  <Chip label='Deshabilitado' size='small' color='default' variant='outlined' />
                ) : (
                  <Chip label='Activo' size='small' color='success' variant='outlined' />
                )}
              </TableCell>
            </TableRow>
          </React.Fragment>
        );
      })}

      {displayRows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={isAdmin ? 10 : canInspectPredictions ? 8 : 7}>
            <Typography color='text.secondary' sx={{ py: 2, px: 2 }}>
              Aún no hay datos suficientes para mostrar el ranking.
            </Typography>
          </TableCell>
        </TableRow>
      ) : null}
    </TableBody>
  );
};
