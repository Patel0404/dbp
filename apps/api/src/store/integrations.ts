// Per-provider credential storage. Credentials are persisted to a JSON file on
// disk so restarts don't wipe what the user pasted; the file is gitignored and
// lives under `data/`.
//
// This is *not* a production secrets store. For production, swap `readFile` /
// `writeFile` for a real vault (AWS Secrets Manager, GCP Secret Manager,
// Hashicorp Vault). The interface is designed so only the read/write calls
// change.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type IntegrationKey =
  | "kalshi"
  | "betfair"
  | "draftkings_deeplink"
  | "fanduel_deeplink"
  | "the_odds_api"
  | "custom_webhook";

export interface IntegrationRecord {
  key: IntegrationKey;
  enabled: boolean;
  credentials: Record<string, string>; // free-form per provider
  updatedAt: string;
  lastTestAt?: string;
  lastTestOk?: boolean;
  lastTestError?: string;
}

const DATA_PATH = resolve(process.cwd(), process.env.INTEGRATIONS_PATH ?? "data/integrations.json");

export class IntegrationStore {
  private records = new Map<IntegrationKey, IntegrationRecord>();
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const raw = await readFile(DATA_PATH, "utf8");
      const parsed = JSON.parse(raw) as IntegrationRecord[];
      for (const r of parsed) this.records.set(r.key, r);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
    this.loaded = true;
  }

  async list(): Promise<IntegrationRecord[]> {
    await this.load();
    return [...this.records.values()];
  }

  async get(key: IntegrationKey): Promise<IntegrationRecord | undefined> {
    await this.load();
    return this.records.get(key);
  }

  async upsert(key: IntegrationKey, patch: Partial<Omit<IntegrationRecord, "key" | "updatedAt">>): Promise<IntegrationRecord> {
    await this.load();
    const existing = this.records.get(key);
    const next: IntegrationRecord = {
      key,
      enabled: patch.enabled ?? existing?.enabled ?? false,
      credentials: { ...(existing?.credentials ?? {}), ...(patch.credentials ?? {}) },
      updatedAt: new Date().toISOString(),
      lastTestAt: patch.lastTestAt ?? existing?.lastTestAt,
      lastTestOk: patch.lastTestOk ?? existing?.lastTestOk,
      lastTestError: patch.lastTestError ?? existing?.lastTestError,
    };
    this.records.set(key, next);
    await this.persist();
    return next;
  }

  async delete(key: IntegrationKey): Promise<void> {
    await this.load();
    this.records.delete(key);
    await this.persist();
  }

  private async persist(): Promise<void> {
    await mkdir(dirname(DATA_PATH), { recursive: true });
    await writeFile(DATA_PATH, JSON.stringify([...this.records.values()], null, 2), "utf8");
  }
}

export const integrationStore = new IntegrationStore();

// Credentials are secrets — never return the raw values to the client. This
// helper returns a display-safe view: secret fields are masked (last 4 chars),
// non-secret fields like emails or URLs pass through unchanged.
const SECRET_FIELDS = new Set([
  "password",
  "apiKey",
  "apiKeyId",
  "privateKeyPem",
  "sessionToken",
  "appKey",
  "webhookSecret",
]);

export function maskCredentials(cred: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(cred)) {
    if (!v) {
      out[k] = "";
      continue;
    }
    if (SECRET_FIELDS.has(k)) {
      out[k] = v.length <= 4 ? "••••" : `••••${v.slice(-4)}`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function maskRecord(rec: IntegrationRecord): IntegrationRecord {
  return { ...rec, credentials: maskCredentials(rec.credentials) };
}
