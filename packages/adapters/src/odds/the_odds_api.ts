// Stub adapter for The Odds API (https://the-odds-api.com). Real credentials
// and endpoint wiring are intentionally left out — this is the shape a
// production adapter should take so the DI container can swap it in.

import type { Event, MarketType, OddsSnapshot, SportKey } from "@dbp/shared";
import type { OddsProvider, ProviderCapabilities } from "../types.js";

export interface TheOddsApiConfig {
  apiKey: string;
  baseUrl?: string;
  regions?: string[]; // e.g. ["us", "uk"]
  fetchImpl?: typeof fetch;
}

export class TheOddsApiProvider implements OddsProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "the-odds-api",
    version: "v4",
    supportedSports: ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "epl", "mma"],
    supportsHistorical: true,
    supportsLive: true,
  };

  constructor(private readonly cfg: TheOddsApiConfig) {}

  async listEvents(_sport: SportKey, _windowHours = 24): Promise<Event[]> {
    throw new Error("TheOddsApiProvider.listEvents not implemented — wire fetch to /v4/sports/{sport}/events here.");
  }

  async listOdds(_params: { eventIds: string[]; markets?: MarketType[] }): Promise<OddsSnapshot[]> {
    throw new Error("TheOddsApiProvider.listOdds not implemented — wire fetch to /v4/sports/{sport}/odds here.");
  }
}
