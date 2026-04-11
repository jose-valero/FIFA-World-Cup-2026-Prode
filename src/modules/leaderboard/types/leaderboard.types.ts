import type { User } from '@supabase/supabase-js';
import type { AdminParticipantOverviewRow } from '../../admin/participants/api/adminParticipants.api';
import type { Match } from '../../matches/types/types';

export interface LeaderboardRow {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_hits: number;
  outcome_hits: number;
  scored_predictions: number;
  is_disabled: boolean;
}

export interface MatchLeaderboard {
  matches: Match[];
  leaderboard: LeaderboardRow[];
}

export interface LeaderboardTableProps {
  displayRows: LeaderboardRow[];
  adminMap: Map<string, AdminParticipantOverviewRow>;
  activePositionMap: Map<string, number>;
  user: User | null;
  isAdmin: boolean;
  canInspectPredictions: boolean;
  isAdminOverviewLoading: boolean;
  isSetParticipantDisabledPending: boolean;
  handleOpenProfile: (row: LeaderboardRow) => void;
  handleOpenParticipantAudit: (row: LeaderboardRow) => void;
  handleToggleParticipantStatus: (row: LeaderboardRow) => void;
}
