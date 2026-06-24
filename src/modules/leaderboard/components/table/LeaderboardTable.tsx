import { Table, TableContainer } from '@mui/material';
import { LeaderboardTableHead } from './LeaderboardTableHead';
import { LeaderboardTableBody } from './LeaderboardTableBody';
import type { LeaderboardTableProps } from '../../types/leaderboard.types';

export const LeaderboardTable = ({
  displayRows,
  adminMap,
  activePositionMap,
  avatarMap,
  user,
  isAdmin,
  canInspectPredictions,
  isAdminOverviewLoading,
  isSetParticipantDisabledPending,
  bottomThreeIds,
  displayMatches,
  predictionsByMatchId,
  reactionsByReceiver,
  onMaranita,
  isMaranitaPending,
  handleOpenProfile,
  handleOpenParticipantAudit,
  handleToggleParticipantStatus
}: LeaderboardTableProps) => {
  return (
    <TableContainer>
      <Table sx={{ minWidth: isAdmin ? 820 : 680 }}>
        <LeaderboardTableHead isAdmin={isAdmin} canInspectPredictions={canInspectPredictions} />
        <LeaderboardTableBody
          displayRows={displayRows}
          adminMap={adminMap}
          activePositionMap={activePositionMap}
          avatarMap={avatarMap}
          user={user}
          isAdmin={isAdmin}
          canInspectPredictions={canInspectPredictions}
          isAdminOverviewLoading={isAdminOverviewLoading}
          isSetParticipantDisabledPending={isSetParticipantDisabledPending}
          bottomThreeIds={bottomThreeIds}
          displayMatches={displayMatches}
          predictionsByMatchId={predictionsByMatchId}
          reactionsByReceiver={reactionsByReceiver}
          onMaranita={onMaranita}
          isMaranitaPending={isMaranitaPending}
          handleOpenProfile={handleOpenProfile}
          handleOpenParticipantAudit={handleOpenParticipantAudit}
          handleToggleParticipantStatus={handleToggleParticipantStatus}
        />
      </Table>
    </TableContainer>
  );
};
