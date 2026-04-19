// Provider registry. Resolves the right ExecutionProvider at request time by
// reading credentials from the integration store and the active product mode
// from config.

import {
  BetfairExecutionProvider,
  DisabledExecutionProvider,
  KalshiExecutionProvider,
  OpenInSportsbookProvider,
  type ExecutionProvider,
} from "@dbp/adapters";
import { integrationStore, type IntegrationKey } from "../store/integrations.js";
import { config } from "../config.js";

export async function resolveExecutionProvider(preferred?: IntegrationKey): Promise<{
  provider: ExecutionProvider;
  key: IntegrationKey | "disabled";
}> {
  if (config.productMode === "advisory") {
    return { provider: new DisabledExecutionProvider(), key: "disabled" };
  }

  const target = preferred ?? (await firstEnabled());
  if (!target) return { provider: new DisabledExecutionProvider(), key: "disabled" };

  const record = await integrationStore.get(target);
  if (!record || !record.enabled) {
    return { provider: new DisabledExecutionProvider(), key: "disabled" };
  }

  switch (target) {
    case "kalshi":
      return {
        provider: new KalshiExecutionProvider({
          email: record.credentials.email,
          password: record.credentials.password,
          apiKeyId: record.credentials.apiKeyId,
          privateKeyPem: record.credentials.privateKeyPem,
          baseUrl: record.credentials.baseUrl,
        }),
        key: "kalshi",
      };
    case "betfair":
      return {
        provider: new BetfairExecutionProvider({
          appKey: record.credentials.appKey,
          sessionToken: record.credentials.sessionToken,
          username: record.credentials.username,
          password: record.credentials.password,
          identityUrl: record.credentials.identityUrl,
          bettingUrl: record.credentials.bettingUrl,
        }),
        key: "betfair",
      };
    case "draftkings_deeplink":
    case "fanduel_deeplink":
      return {
        provider: new OpenInSportsbookProvider((params) => buildDeepLink(target, params)),
        key: target,
      };
    default:
      return { provider: new DisabledExecutionProvider(), key: "disabled" };
  }
}

async function firstEnabled(): Promise<IntegrationKey | undefined> {
  const all = await integrationStore.list();
  return all.find((r) => r.enabled)?.key;
}

function buildDeepLink(
  key: IntegrationKey,
  params: { marketId: string; bookmakerId: string; side: string },
): string {
  // Sportsbook deep-link URL formats are not officially documented and change.
  // We link to the event/market page; the user completes the slip themselves.
  const host =
    key === "draftkings_deeplink"
      ? "https://sportsbook.draftkings.com"
      : "https://sportsbook.fanduel.com";
  return `${host}/event/${encodeURIComponent(params.marketId)}`;
}

// Runs a provider-specific health check so the Settings UI can show a status chip.
export async function testIntegration(key: IntegrationKey): Promise<{ ok: boolean; error?: string }> {
  const record = await integrationStore.get(key);
  if (!record) return { ok: false, error: "not configured" };

  switch (key) {
    case "kalshi":
      return new KalshiExecutionProvider({
        email: record.credentials.email,
        password: record.credentials.password,
        baseUrl: record.credentials.baseUrl,
      }).testConnection();
    case "betfair":
      return new BetfairExecutionProvider({
        appKey: record.credentials.appKey,
        sessionToken: record.credentials.sessionToken,
        username: record.credentials.username,
        password: record.credentials.password,
        identityUrl: record.credentials.identityUrl,
        bettingUrl: record.credentials.bettingUrl,
      }).testConnection();
    case "the_odds_api": {
      const key = record.credentials.apiKey;
      if (!key) return { ok: false, error: "missing apiKey" };
      const res = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${key}`);
      return res.ok ? { ok: true } : { ok: false, error: `the-odds-api ${res.status}` };
    }
    case "draftkings_deeplink":
    case "fanduel_deeplink":
      return { ok: true };
    case "custom_webhook": {
      const url = record.credentials.url;
      if (!url) return { ok: false, error: "missing url" };
      try {
        const res = await fetch(url, { method: "GET" });
        return res.ok ? { ok: true } : { ok: false, error: `webhook ${res.status}` };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : "unknown" };
      }
    }
    default:
      return { ok: false, error: "unsupported provider" };
  }
}

export const PROVIDER_CATALOG: Array<{
  key: IntegrationKey;
  displayName: string;
  description: string;
  supportsRealMoney: boolean;
  fields: Array<{ name: string; label: string; type: "text" | "password" | "textarea"; placeholder?: string; required?: boolean; help?: string }>;
  setupUrl?: string;
}> = [
  {
    key: "kalshi",
    displayName: "Kalshi",
    description: "CFTC-regulated US event-contracts exchange. Real API. Best option for automated US placement.",
    supportsRealMoney: true,
    setupUrl: "https://trading.kalshi.com/account/profile",
    fields: [
      { name: "email", label: "Email", type: "text", required: true },
      { name: "password", label: "Password", type: "password", required: true, help: "Used for /login. Stored server-side only." },
      { name: "baseUrl", label: "Base URL (optional)", type: "text", placeholder: "https://trading-api.kalshi.com/trade-api/v2" },
    ],
  },
  {
    key: "betfair",
    displayName: "Betfair Exchange",
    description: "UK/EU/AU betting exchange with a documented API. Not available to US users.",
    supportsRealMoney: true,
    setupUrl: "https://developer.betfair.com/",
    fields: [
      { name: "appKey", label: "Application Key", type: "password", required: true },
      { name: "username", label: "Username", type: "text" },
      { name: "password", label: "Password", type: "password" },
      { name: "sessionToken", label: "Session Token (optional)", type: "password", help: "If provided, skips interactive login." },
    ],
  },
  {
    key: "draftkings_deeplink",
    displayName: "DraftKings (deep-link)",
    description: "Opens DraftKings to the event page for manual placement. No API — no automation possible for US consumer books.",
    supportsRealMoney: false,
    fields: [],
  },
  {
    key: "fanduel_deeplink",
    displayName: "FanDuel (deep-link)",
    description: "Opens FanDuel to the event page for manual placement. No API — no automation possible for US consumer books.",
    supportsRealMoney: false,
    fields: [],
  },
  {
    key: "the_odds_api",
    displayName: "The Odds API",
    description: "Odds ingestion provider, not an execution provider. Adds real odds data to replace the mock feed.",
    supportsRealMoney: false,
    setupUrl: "https://the-odds-api.com/",
    fields: [{ name: "apiKey", label: "API Key", type: "password", required: true }],
  },
  {
    key: "custom_webhook",
    displayName: "Custom webhook",
    description: "Send bet placements to your own URL (e.g. Zapier, Make, your own service). Useful if you have a private integration.",
    supportsRealMoney: false,
    fields: [
      { name: "url", label: "Webhook URL", type: "text", required: true },
      { name: "webhookSecret", label: "Shared secret (optional)", type: "password" },
    ],
  },
];
