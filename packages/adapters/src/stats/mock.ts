import type { Injury, SportKey } from "@dbp/shared";
import type { ProviderCapabilities, StatsProvider } from "../types.js";

export class MockStatsProvider implements StatsProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "mock-stats",
    version: "0.1.0",
    supportedSports: ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "epl", "mma"],
    supportsHistorical: true,
    supportsLive: false,
  };

  constructor(
    private readonly injuries: Injury[],
    private readonly lineups: Record<string, { home: string[]; away: string[] }>,
  ) {}

  async listInjuries(_sport: SportKey): Promise<Injury[]> {
    return this.injuries;
  }

  async listLineups(eventId: string): Promise<{ home: string[]; away: string[] }> {
    return this.lineups[eventId] ?? { home: [], away: [] };
  }
}
