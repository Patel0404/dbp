import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { integrationStore, maskRecord, type IntegrationKey } from "../store/integrations.js";
import { PROVIDER_CATALOG, testIntegration } from "../services/provider_registry.js";

const INTEGRATION_KEYS: IntegrationKey[] = [
  "kalshi",
  "betfair",
  "draftkings_deeplink",
  "fanduel_deeplink",
  "the_odds_api",
  "custom_webhook",
];

const IntegrationKeySchema = z.enum([
  "kalshi",
  "betfair",
  "draftkings_deeplink",
  "fanduel_deeplink",
  "the_odds_api",
  "custom_webhook",
]);

const UpsertBody = z.object({
  enabled: z.boolean().optional(),
  credentials: z.record(z.string().min(0)).optional(),
});

export async function integrationRoutes(app: FastifyInstance) {
  app.get("/integrations/catalog", { schema: { tags: ["admin"] } }, async () => {
    return { catalog: PROVIDER_CATALOG };
  });

  app.get("/integrations", { schema: { tags: ["admin"] } }, async () => {
    const records = await integrationStore.list();
    const byKey = new Map(records.map((r) => [r.key, r]));
    return {
      integrations: INTEGRATION_KEYS.map((key) => {
        const rec = byKey.get(key);
        return rec ? maskRecord(rec) : null;
      }),
    };
  });

  app.put("/integrations/:key", { schema: { tags: ["admin"] } }, async (req, reply) => {
    const params = z.object({ key: IntegrationKeySchema }).parse(req.params);
    const body = UpsertBody.parse(req.body ?? {});
    // Masked values (ones containing "••••") come back when the user edits the
    // form without retyping secrets. Drop them so we don't overwrite the stored
    // secret with a mask.
    const filteredCreds: Record<string, string> = {};
    if (body.credentials) {
      for (const [k, v] of Object.entries(body.credentials)) {
        if (typeof v === "string" && !v.includes("••••") && v !== "") filteredCreds[k] = v;
      }
    }
    const record = await integrationStore.upsert(params.key, {
      enabled: body.enabled,
      credentials: filteredCreds,
    });
    return maskRecord(record);
  });

  app.delete("/integrations/:key", { schema: { tags: ["admin"] } }, async (req) => {
    const params = z.object({ key: IntegrationKeySchema }).parse(req.params);
    await integrationStore.delete(params.key);
    return { ok: true };
  });

  app.post("/integrations/:key/test", { schema: { tags: ["admin"] } }, async (req) => {
    const params = z.object({ key: IntegrationKeySchema }).parse(req.params);
    const result = await testIntegration(params.key);
    await integrationStore.upsert(params.key, {
      lastTestAt: new Date().toISOString(),
      lastTestOk: result.ok,
      lastTestError: result.error,
    });
    return result;
  });
}
