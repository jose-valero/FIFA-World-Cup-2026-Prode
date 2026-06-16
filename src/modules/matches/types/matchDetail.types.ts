export type MatchDetailStatus = 'scheduled' | 'live' | 'finished';
export type MatchDetailEventSide = 'home' | 'away';
export type MatchDetailEventType =
  | 'goal'
  | 'penalty_goal'
  | 'own_goal'
  | 'yellow_card'
  | 'red_card'
  | 'substitution';

export interface MatchDetailTeam {
  name: string;
  code: string;
  color?: string | null;
  alternateColor?: string | null;
  logo?: string | null;
}

export interface MatchDetailScore {
  home: number;
  away: number;
}

export interface MatchDetailEvent {
  minute: string;
  side: MatchDetailEventSide;
  type: MatchDetailEventType;
  player: string;
  label: string;
}

export interface MatchDetailPayload {
  id: string;
  stage: string;
  group: string;
  groupCode: string | null;
  kickoffAt: string;
  status: MatchDetailStatus;
  minuteLabel: string | null;
  venueName: string;
  venueCity: string;
  homeTeam: MatchDetailTeam;
  awayTeam: MatchDetailTeam;
  score: MatchDetailScore | null;
  events: MatchDetailEvent[];
  espnEnriched: boolean;
  lineups: MatchLineups | null;
}

export interface MatchLineups {
  available: boolean;
  home: TeamLineup | null;
  away: TeamLineup | null;
}

export interface TeamLineup {
  formation: LineupFormation | null;
  starters: LineupPlayer[];
  bench: LineupPlayer[];
}

export interface LineupFormation {
  summary: string;
  name: string;
  numRows: number;
}

export interface LineupPlayer {
  playerId: string;
  name: string;
  shortName: string | null;
  jersey: string | null;
  position: LineupPosition | null;
  starter: boolean;
  formationPlace: number | null;
  active: boolean;
  subbedIn: SubStatus;
  subbedOut: SubStatus;
}

export interface LineupPosition {
  id: string | null;
  name: string | null;
  abbreviation: string | null;
}

export interface SubStatus {
  didSub: boolean;
  minute: string | null;
}
