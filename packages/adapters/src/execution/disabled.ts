import type {
  BetOrderStatus,
  BetPreview,
  ExecutionProvider,
  PlaceBetParams,
  PreviewBetParams,
  ProviderCapabilities,
} from "../types.js";

// Default execution provider for advisory mode. Always rejects, so the API
// layer can ship with real-money features disabled by configuration rather
// than by forgetting to wire anything up.
export class DisabledExecutionProvider implements ExecutionProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "disabled",
    version: "0.1.0",
    supportedSports: [],
    supportsHistorical: false,
    supportsLive: false,
  };

  async previewBet(_params: PreviewBetParams): Promise<BetPreview> {
    return { accepted: false, rejectionReason: "execution_disabled_advisory_mode" };
  }

  async placeBet(_params: PlaceBetParams): Promise<BetOrderStatus> {
    return { orderId: "", state: "rejected", rejectionReason: "execution_disabled_advisory_mode" };
  }

  async status(_orderId: string): Promise<BetOrderStatus> {
    return { orderId: "", state: "rejected", rejectionReason: "execution_disabled_advisory_mode" };
  }
}
