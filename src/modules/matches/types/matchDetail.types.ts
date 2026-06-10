export type MatchDetailStatus = 'scheduled' | 'live' | 'finished';
export type MatchDetailEventSide = 'home' | 'away';
export type MatchDetailEventType = 'goal' | 'penalty_goal' | 'own_goal';

export interface MatchDetailTeam {
  name: string;
  code: string;
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
}
