import type { NewsItem, SportKey } from "@dbp/shared";
import type { NewsProvider, ProviderCapabilities } from "../types.js";

export class MockNewsProvider implements NewsProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "mock-news",
    version: "0.1.0",
    supportedSports: ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "epl", "mma"],
    supportsHistorical: false,
    supportsLive: false,
  };

  constructor(private readonly items: NewsItem[]) {}

  async listNews(params: { sport?: SportKey; sinceIso?: string }): Promise<NewsItem[]> {
    const since = params.sinceIso ? Date.parse(params.sinceIso) : 0;
    return this.items.filter((n) => Date.parse(n.publishedAt) >= since);
  }
}
