// Deterministic fake odds provider. Used in tests and for local development so
// the full pipeline runs without any vendor credentials.

import { americanToDecimal, americanToImpliedProbability } from "@dbp/shared";
import type { Event, MarketType, OddsSnapshot, SportKey } from "@dbp/shared";
import type { OddsProvider, ProviderCapabilities } from "../types.js";

export interface MockOddsSeed {
  events: Event[];
  oddsByEvent: Record<string, OddsSnapshot[]>;
}

export class MockOddsProvider implements OddsProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "mock",
    version: "0.1.0",
    supportedSports: ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "epl", "mma"],
    supportsHistorical: false,
    supportsLive: false,
  };

  constructor(private readonly seed: MockOddsSeed) {}

  async listEvents(_sport: SportKey, _windowHours = 24): Promise<Event[]> {
    return this.seed.events;
  }

  async listOdds(params: { eventIds: string[]; markets?: MarketType[] }): Promise<OddsSnapshot[]> {
    const result: OddsSnapshot[] = [];
    for (const id of params.eventIds) {
      const rows = this.seed.oddsByEvent[id] ?? [];
      result.push(...rows);
    }
    return result;
  }
}

export function makeAmericanSnapshot(
  id: string,
  marketId: string,
  bookmakerId: string,
  side: OddsSnapshot["side"],
  american: number,
  capturedAt: string,
): OddsSnapshot {
  return {
    id,
    marketId,
    bookmakerId,
    side,
    americanOdds: american,
    decimalOdds: americanToDecimal(american),
    impliedProbability: americanToImpliedProbability(american),
    capturedAt,
  };
}
