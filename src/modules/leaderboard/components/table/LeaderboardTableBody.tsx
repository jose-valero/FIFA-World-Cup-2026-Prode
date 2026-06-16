import React from 'react';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { podiumStyle } from '../../styles/atoms';
import { getInitial } from '../../../../shared/utils/getInitial';
import type { InlinePrediction, LeaderboardTableProps, ReactionSummary } from '../../types/leaderboard.types';
import type { Match } from '../../../matches/types/types';
import { TeamFlag } from '../../../../shared/components/TeamFlag';
import { MaranitaButton } from '../MaranitaButton';
import VisibilityIcon from '@mui/icons-material/Visibility';

function teamCode(code: string | null, name: string): string {
  return code ?? name.substring(0, 3).toUpperCase();
}

function InlinePredictionLine({
  match,
  pred,
  liveMatchCount,
  reaction,
  isCurrentUser,
  onMaranita,
  isMaranitaPending
}: {
  match: Match;
  pred: InlinePrediction | undefined;
  liveMatchCount: number;
  reaction: ReactionSummary | undefined;
  isCurrentUser: boolean;
  onMaranita: () => void;
  isMaranitaPending: boolean;
}) {
  const home = teamCode(match.homeTeamCode, match.homeTeam);
  const away = teamCode(match.awayTeamCode, match.awayTeam);
  const isLive = match.status === 'live';
  const siblings = liveMatchCount - 1;

  if (!pred) {
    return (
      <Typography variant='caption' color='text.disabled' sx={{ fontSize: '0.7rem' }}>
        Sin pronóstico
      </Typography>
    );
  }

  return (
    <Stack direction='row' spacing={0.4} alignItems='center'>
      {/* {isLive ? (
        <FiberManualRecordIcon sx={{ fontSize: 7, color: 'error.main', flexShrink: 0 }} />
      ) : null} */}
      <TeamFlag teamCode={match.homeTeamCode} teamName={match.homeTeam} size={12} />
      <Typography variant='caption' sx={{ fontSize: '0.7rem', color: 'text.secondary' }} noWrap>
        {home} {pred.homeScore}–{pred.awayScore} {away}
      </Typography>
      <TeamFlag teamCode={match.awayTeamCode} teamName={match.awayTeam} size={12} />
      {siblings > 0 ? (
        <Typography variant='caption' sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
          +{siblings}
        </Typography>
      ) : null}
      {isLive ? (
        <MaranitaButton
          total={reaction?.total ?? 0}
          myCount={reaction?.myCount ?? 0}
          isCurrentUser={isCurrentUser}
          isPending={isMaranitaPending}
          onClick={onMaranita}
        />
      ) : null}
    </Stack>
  );
}

export const LeaderboardTableBody = ({
  displayRows,
  adminMap,
  activePositionMap,
  avatarMap,
  user,
  isAdmin,
  canInspectPredictions,
  isSetParticipantDisabledPending,
  bottomThreeIds,
  relevantMatch,
  predictionsByUserId,
  liveMatchCount,
  reactionsByReceiver,
  onMaranita,
  isMaranitaPending,
  handleOpenProfile,
  handleOpenParticipantAudit,
  handleToggleParticipantStatus
}: LeaderboardTableProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const colSpan = 6 + (canInspectPredictions && !isMobile ? 1 : 0) + (isAdmin ? 1 : 0);

  return (
    <TableBody>
      {displayRows.map((row, index) => {
        const previousRow = displayRows[index - 1];
        const startsDisabledSection = row.is_disabled && !previousRow?.is_disabled;

        const adminRow = adminMap.get(row.user_id);
        const isDisabledRow = Boolean(row.is_disabled);
        const position = isDisabledRow ? null : (activePositionMap.get(row.user_id) ?? null);
        const isCurrentUser = Boolean(user?.id && row.user_id === user.id);
        const isBottomThree = !isDisabledRow && bottomThreeIds.has(row.user_id);

        const inlinePred =
          canInspectPredictions && relevantMatch && !isDisabledRow ? predictionsByUserId.get(row.user_id) : undefined;

        const showInlinePred = canInspectPredictions && Boolean(relevantMatch) && !isDisabledRow;

        return (
          <React.Fragment key={row.user_id}>
            {startsDisabledSection ? (
              <TableRow>
                <TableCell colSpan={colSpan} align='center'>
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
                    : isBottomThree
                      ? alpha(theme.palette.error.dark, 0.15)
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
              <TableCell width={40} sx={{ pr: 0 }}>
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                  {position ? (
                    <Typography fontWeight={800}>#{position}</Typography>
                  ) : (
                    <Typography fontWeight={800}>—</Typography>
                  )}
                </Stack>
              </TableCell>

              <TableCell>
                <Stack direction='row' spacing={1.5} alignItems='center'>
                  <Avatar
                    src={avatarMap.get(row.user_id) ?? undefined}
                    sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 800, flexShrink: 0 }}
                  >
                    {getInitial(row.display_name)}
                  </Avatar>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction='row' spacing={0.75} alignItems='center' flexWrap='wrap' useFlexGap>
                      <Typography
                        onClick={() => handleOpenProfile(row)}
                        fontWeight={isCurrentUser ? 800 : 700}
                        noWrap
                        sx={{
                          cursor: 'pointer',
                          maxWidth: { xs: 90, sm: 200 }
                        }}
                      >
                        {row.display_name}
                      </Typography>

                      {isMobile && canInspectPredictions && !isDisabledRow ? (
                        <IconButton
                          size='small'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenParticipantAudit(row);
                          }}
                          aria-label={`Ver pronósticos de ${row.display_name}`}
                          sx={{ flexShrink: 0, color: 'text.secondary', width: 26, height: 26 }}
                        >
                          <VisibilityIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      ) : null}
                    </Stack>

                    {showInlinePred && relevantMatch ? (
                      <InlinePredictionLine
                        match={relevantMatch}
                        pred={inlinePred}
                        liveMatchCount={liveMatchCount}
                        reaction={reactionsByReceiver.get(row.user_id)}
                        isCurrentUser={isCurrentUser}
                        onMaranita={() => onMaranita(row.user_id)}
                        isMaranitaPending={isMaranitaPending}
                      />
                    ) : null}
                  </Box>
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

              {canInspectPredictions && !isMobile ? (
                <TableCell align='right' onClick={(e) => e.stopPropagation()}>
                  <Button size='small' variant='outlined' onClick={() => handleOpenParticipantAudit(row)}>
                    Ver pronósticos
                  </Button>
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
            </TableRow>
          </React.Fragment>
        );
      })}

      {displayRows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={colSpan}>
            <Typography color='text.secondary' sx={{ py: 2, px: 2 }}>
              Aún no hay datos suficientes para mostrar el ranking.
            </Typography>
          </TableCell>
        </TableRow>
      ) : null}
    </TableBody>
  );
};
