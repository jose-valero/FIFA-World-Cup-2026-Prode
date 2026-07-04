import type { User } from '@supabase/supabase-js';
import type { AdminParticipantOverviewRow } from '../../admin/participants/api/adminParticipants.api';
import type { Match } from '../../matches/types/types';

export type InlinePrediction = { homeScore: number; awayScore: number };
export type ReactionSummary = { total: number; myCount: number };

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
  avatarMap: Map<string, string | null>;
  user: User | null;
  isAdmin: boolean;
  // canShowFeaturedPrediction: show the inline prediction for the featured match (live or next scheduled).
  // Only requires authentication — not tied to audits_visible.
  canShowFeaturedPrediction: boolean;
  // canInspectPredictions: gates the full "Ver pronósticos" audit drawer (admin-controlled via audits_visible).
  canInspectPredictions: boolean;
  isAdminOverviewLoading: boolean;
  isSetParticipantDisabledPending: boolean;
  bottomThreeIds: Set<string>;
  // displayMatches: the single featured match (live first, then next scheduled).
  displayMatches: Match[];
  // predictionsByMatchId: matchId → userId → prediction for the featured match.
  predictionsByMatchId: Map<string, Map<string, InlinePrediction>>;
  reactionsByReceiver: Map<string, ReactionSummary>;
  onMaranita: (receiverId: string) => void;
  isMaranitaPending: boolean;
  handleOpenProfile: (row: LeaderboardRow) => void;
  handleOpenParticipantAudit: (row: LeaderboardRow) => void;
  handleToggleParticipantStatus: (row: LeaderboardRow) => void;
}
