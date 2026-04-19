import type {
  BetOrderStatus,
  BetPreview,
  ExecutionProvider,
  PlaceBetParams,
  PreviewBetParams,
  ProviderCapabilities,
} from "../types.js";

// "Open in sportsbook" fallback. Used when the user's jurisdiction has no
// licensed wager API — the app simply links out. We still record the intent
// so analytics can measure the advisory → placement funnel.
export class OpenInSportsbookProvider implements ExecutionProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "open-in-sportsbook",
    version: "0.1.0",
    supportedSports: [],
    supportsHistorical: false,
    supportsLive: false,
  };

  constructor(private readonly deepLinkBuilder: (params: PreviewBetParams) => string) {}

  async previewBet(params: PreviewBetParams): Promise<BetPreview> {
    return { accepted: true, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  }

  async placeBet(params: PlaceBetParams): Promise<BetOrderStatus> {
    // Not a placement — we return "pending" with the deep-link in the order id.
    return {
      orderId: `link:${this.deepLinkBuilder(params)}`,
      state: "pending",
    };
  }

  async status(orderId: string): Promise<BetOrderStatus> {
    return { orderId, state: "pending" };
  }
}
