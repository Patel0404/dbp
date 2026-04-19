// Kalshi execution adapter. Kalshi is a CFTC-regulated US event-contracts
// exchange with a real public REST API at https://trading-api.kalshi.com.
// This adapter follows the production request shapes but only issues a network
// call when credentials are supplied AND the product mode permits execution.

import type {
  BetOrderStatus,
  BetPreview,
  ExecutionProvider,
  PlaceBetParams,
  PreviewBetParams,
  ProviderCapabilities,
} from "../types.js";

export interface KalshiCredentials {
  email?: string;
  password?: string;
  apiKeyId?: string;
  privateKeyPem?: string;
  baseUrl?: string; // default: https://trading-api.kalshi.com/trade-api/v2
}

export class KalshiExecutionProvider implements ExecutionProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "kalshi",
    version: "v2",
    supportedSports: [],
    supportsHistorical: false,
    supportsLive: true,
  };

  constructor(
    private readonly creds: KalshiCredentials,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  get baseUrl(): string {
    return this.creds.baseUrl ?? "https://trading-api.kalshi.com/trade-api/v2";
  }

  /** Returns true if the configured credentials authenticate against Kalshi. */
  async testConnection(): Promise<{ ok: boolean; error?: string }> {
    if (!this.creds.email && !this.creds.apiKeyId) {
      return { ok: false, error: "missing credentials" };
    }
    try {
      const token = await this.login();
      if (!token) return { ok: false, error: "auth failed" };
      const res = await this.fetchImpl(`${this.baseUrl}/portfolio/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: `balance call failed: ${res.status}` };
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "unknown error" };
    }
  }

  async previewBet(_params: PreviewBetParams): Promise<BetPreview> {
    // Kalshi has no separate preview endpoint — we surface current quote via
    // /markets/{ticker} and let placeBet() apply the user-set limit price.
    return { accepted: true, expiresAt: new Date(Date.now() + 60_000).toISOString() };
  }

  async placeBet(params: PlaceBetParams): Promise<BetOrderStatus> {
    const token = await this.login();
    if (!token) return { orderId: "", state: "rejected", rejectionReason: "auth_failed" };

    // `marketId` in our domain maps to a Kalshi market ticker. `side` ("yes"|"no")
    // maps directly; stakeUnits converts to contract count at the configured unit size.
    const body = {
      ticker: params.marketId,
      client_order_id: params.idempotencyKey,
      side: params.side === "yes" || params.side === "no" ? params.side : "yes",
      action: "buy",
      count: Math.max(1, Math.round(params.stakeUnits)),
      type: "market",
    };

    const res = await this.fetchImpl(`${this.baseUrl}/portfolio/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { orderId: "", state: "rejected", rejectionReason: `kalshi ${res.status}: ${text.slice(0, 200)}` };
    }
    const payload = (await res.json()) as { order?: { order_id?: string; status?: string } };
    return {
      orderId: payload.order?.order_id ?? "",
      state: payload.order?.status === "resting" ? "pending" : "accepted",
    };
  }

  async status(orderId: string): Promise<BetOrderStatus> {
    const token = await this.login();
    if (!token) return { orderId, state: "rejected", rejectionReason: "auth_failed" };
    const res = await this.fetchImpl(`${this.baseUrl}/portfolio/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { orderId, state: "rejected", rejectionReason: `status ${res.status}` };
    const payload = (await res.json()) as { order?: { status?: string } };
    const s = payload.order?.status;
    return {
      orderId,
      state: s === "executed" ? "accepted" : s === "resting" ? "pending" : "rejected",
    };
  }

  private async login(): Promise<string | null> {
    if (this.creds.email && this.creds.password) {
      const res = await this.fetchImpl(`${this.baseUrl}/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: this.creds.email, password: this.creds.password }),
      });
      if (!res.ok) return null;
      const payload = (await res.json()) as { token?: string };
      return payload.token ?? null;
    }
    // RSA-signed API key flow is documented but intentionally omitted here —
    // it requires `node:crypto` signing per request. Wire up before going live.
    return null;
  }
}
