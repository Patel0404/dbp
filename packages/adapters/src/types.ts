import type {
  Event,
  Injury,
  MarketType,
  NewsItem,
  OddsSnapshot,
  SportKey,
} from "@dbp/shared";

export interface ProviderCapabilities {
  name: string;
  version: string;
  supportedSports: SportKey[];
  supportsHistorical: boolean;
  supportsLive: boolean;
}

export interface OddsProvider {
  capabilities: ProviderCapabilities;
  listEvents(sport: SportKey, windowHours?: number): Promise<Event[]>;
  listOdds(params: { eventIds: string[]; markets?: MarketType[] }): Promise<OddsSnapshot[]>;
  historicalOdds?(params: { eventId: string; from: string; to: string }): Promise<OddsSnapshot[]>;
}

export interface StatsProvider {
  capabilities: ProviderCapabilities;
  listInjuries(sport: SportKey): Promise<Injury[]>;
  listLineups(eventId: string): Promise<{ home: string[]; away: string[] }>;
}

export interface NewsProvider {
  capabilities: ProviderCapabilities;
  listNews(params: { sport?: SportKey; sinceIso?: string }): Promise<NewsItem[]>;
}

export interface ExecutionProvider {
  capabilities: ProviderCapabilities;
  previewBet(params: PreviewBetParams): Promise<BetPreview>;
  placeBet(params: PlaceBetParams): Promise<BetOrderStatus>;
  status(orderId: string): Promise<BetOrderStatus>;
}

export interface PreviewBetParams {
  marketId: string;
  side: string;
  stakeUnits: number;
  bookmakerId: string;
  userId: string;
  jurisdictionCode: string;
}

export interface BetPreview {
  accepted: boolean;
  quotedDecimalOdds?: number;
  rejectionReason?: string;
  expiresAt?: string;
}

export interface PlaceBetParams extends PreviewBetParams {
  previewId?: string;
  idempotencyKey: string;
}

export interface BetOrderStatus {
  orderId: string;
  state: "pending" | "accepted" | "rejected" | "settled";
  filledStake?: number;
  filledOdds?: number;
  rejectionReason?: string;
  settlement?: "win" | "loss" | "push" | "void";
}

export interface GeoProvider {
  capabilities: ProviderCapabilities;
  resolveJurisdiction(params: { ip?: string; latitude?: number; longitude?: number }): Promise<{
    code: string;
    country: string;
    region?: string;
    confidence: number;
  }>;
}
