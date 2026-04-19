// Core domain model shared across API, workers, and the web app.
// Keep this file dependency-free so any runtime can import it.

export type SportKey =
  | "nfl"
  | "nba"
  | "mlb"
  | "nhl"
  | "ncaaf"
  | "ncaab"
  | "epl"
  | "mma";

export type MarketType =
  | "moneyline"
  | "spread"
  | "total"
  | "team_total"
  | "player_prop";

export type OutcomeSide = "home" | "away" | "draw" | "over" | "under" | "yes" | "no";

export interface Sport {
  id: string;
  key: SportKey;
  displayName: string;
  active: boolean;
}

export interface League {
  id: string;
  sportId: string;
  name: string;
  externalId?: string;
}

export interface Team {
  id: string;
  leagueId: string;
  name: string;
  shortName: string;
  externalId?: string;
}

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position?: string;
  externalId?: string;
}

export interface Event {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  startsAt: string; // ISO8601
  status: "scheduled" | "live" | "final" | "cancelled";
  externalId?: string;
  venue?: string;
  weather?: WeatherSnapshot;
}

export interface WeatherSnapshot {
  tempF?: number;
  windMph?: number;
  precipitationPct?: number;
  indoor?: boolean;
}

export interface Bookmaker {
  id: string;
  key: string; // e.g. "draftkings"
  displayName: string;
  regions: string[]; // e.g. ["us", "uk"]
}

export interface Market {
  id: string;
  eventId: string;
  type: MarketType;
  line?: number; // spread / total / prop line
  playerId?: string; // populated for player_prop
  propKey?: string; // e.g. "points", "rebounds"
  lastUpdated: string;
}

export interface OddsSnapshot {
  id: string;
  marketId: string;
  bookmakerId: string;
  side: OutcomeSide;
  americanOdds: number;
  decimalOdds: number;
  impliedProbability: number;
  capturedAt: string;
}

export interface OddsMovement {
  marketId: string;
  bookmakerId: string;
  side: OutcomeSide;
  openAmerican: number;
  currentAmerican: number;
  closingAmerican?: number;
  deltaAmerican: number;
  steamScore: number; // 0..1, rapid-movement signal
  reverseLineMovement: boolean;
}

export interface Injury {
  id: string;
  playerId: string;
  status: "out" | "doubtful" | "questionable" | "probable" | "active";
  designation?: string;
  reportedAt: string;
  severity: number; // 0..1, 1 = most impactful
}

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceCredibility: number; // 0..1
  publishedAt: string;
  entities: NewsEntity[];
  sentiment: "positive" | "negative" | "uncertain";
  impact: "positive" | "negative" | "uncertain";
  urgency: number; // 0..1
  relevance: number; // 0..1
  confidence: number; // 0..1
}

export interface NewsEntity {
  kind: "team" | "player" | "event";
  id: string;
  label: string;
}

export interface Prediction {
  id: string;
  modelVersion: string;
  marketId: string;
  side: OutcomeSide;
  predictedProbability: number; // 0..1
  marketImpliedProbability: number; // 0..1
  edge: number; // predicted - implied
  expectedValue: number; // unit bankroll EV
  confidence: number; // 0..1
  risk: number; // 0..1
  newsStability: number; // 0..1
  lineVolatility: number; // 0..1
  recommendedUnitsMin: number;
  recommendedUnitsMax: number;
  contributingFactors: ExplanationFactor[];
  generatedAt: string;
  dataRefreshedAt: string;
}

export interface ExplanationFactor {
  key: string;
  label: string;
  valueText: string;
  direction: "for" | "against" | "neutral";
  weight: number; // contribution weight 0..1
}

export interface Recommendation {
  id: string;
  predictionId: string;
  eventId: string;
  marketId: string;
  bookmakerId: string;
  side: OutcomeSide;
  rankScore: number;
  category: RecommendationCategory;
  explanation: RecommendationExplanation;
  createdAt: string;
  expiresAt: string;
  invalidatedAt?: string;
  invalidationReason?: string;
}

export type RecommendationCategory =
  | "highest_win_probability"
  | "best_value"
  | "safest"
  | "contrarian"
  | "live"
  | "news_driven";

export interface RecommendationExplanation {
  summary: string;
  keyFactors: ExplanationFactor[];
  injuryNotes: string[];
  lineMovementNote?: string;
  historicalNote?: string;
  riskWarning: string;
  dataRefreshedAt: string;
}

export interface Bankroll {
  userId: string;
  currency: string;
  total: number;
  unitSize: number;
  dailyCap: number;
  weeklyCap: number;
  monthlyCap: number;
  stopLossPct: number;
  kellyFraction: number;
}

export interface UserRiskTolerance {
  risk: "conservative" | "balanced" | "aggressive";
  maxPerBetUnits: number;
  minConfidence: number;
  minEdge: number;
}

export interface TopPick {
  recommendation: Recommendation;
  prediction: Prediction;
  event: Event;
  home: Team;
  away: Team;
  market: Market;
  bookmaker: Bookmaker;
  odds: OddsSnapshot;
}
