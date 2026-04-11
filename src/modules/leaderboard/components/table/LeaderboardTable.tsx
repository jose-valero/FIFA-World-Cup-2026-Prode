import { Table, TableContainer } from '@mui/material';
import { LeaderboardTableHead } from './LeaderboardTableHead';
import { LeaderboardTableBody } from './LeaderboardTableBody';
import type { LeaderboardTableProps } from '../../types/leaderboard.types';

export const LeaderboardTable = ({
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
    <TableContainer>
      <Table sx={{ minWidth: isAdmin ? 1060 : 840 }}>
        <LeaderboardTableHead isAdmin={isAdmin} canInspectPredictions={canInspectPredictions} />
        <LeaderboardTableBody
          displayRows={displayRows}
          adminMap={adminMap}
          activePositionMap={activePositionMap}
          user={user}
          isAdmin={isAdmin}
          canInspectPredictions={canInspectPredictions}
          isAdminOverviewLoading={isAdminOverviewLoading}
          isSetParticipantDisabledPending={isSetParticipantDisabledPending}
          handleOpenProfile={handleOpenProfile}
          handleOpenParticipantAudit={handleOpenParticipantAudit}
          handleToggleParticipantStatus={handleToggleParticipantStatus}
        />
      </Table>
    </TableContainer>
  );
};
