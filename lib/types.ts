export type DateBucket = "today" | "tomorrow" | "past";

export type MarketType = "1X2" | "Over/Under 2.5" | "BTTS";

export type ConfidenceLevel = "Low" | "Medium" | "High";

export type PredictionSort = "confidence" | "kickoff";

export type RiskTag = "Safe" | "Medium Risk" | "Value Bet";

export type FormTrend = "W" | "D" | "L";

export interface LeagueInfo {
  id: string;
  name: string;
  country: string;
  badgeText: string;
  badgeTone: "blue" | "green" | "orange" | "purple" | "red";
  badgeUrl: string;
  season: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  badgeUrl: string;
}

export interface TeamTableSnapshot {
  rank: number;
  points: number;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  pointsPerGame: number;
  form: FormTrend[];
}

export interface ProbabilitySet {
  home: number;
  draw: number;
  away: number;
  over25: number;
  under25: number;
  bttsYes: number;
  bttsNo: number;
}

export interface ExpectedGoals {
  home: number;
  away: number;
  total: number;
}

export interface MatchTrend {
  label: string;
  value: string;
}

export interface MatchRecommendation {
  market: MarketType;
  selection: string;
  confidence: ConfidenceLevel;
  rating: number;
  riskTag: RiskTag;
  rationale: string;
}

export interface MatchRecord {
  id: string;
  date: string;
  dateLabel: string;
  dateBucket: DateBucket;
  kickoffUtc: string;
  venue: string;
  league: LeagueInfo;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  probabilities: ProbabilitySet;
  xg: ExpectedGoals;
  table: {
    home: TeamTableSnapshot;
    away: TeamTableSnapshot;
  };
  headToHead: MatchTrend[];
  headlineStats: MatchTrend[];
  tacticalNotes: string[];
  recommendation: MatchRecommendation;
}

export interface PredictionResponse {
  matches: MatchRecord[];
  generatedAt: string;
  stale: boolean;
  partial: boolean;
  warnings: string[];
}
