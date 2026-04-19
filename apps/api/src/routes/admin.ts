import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { DEFAULT_RANKING_WEIGHTS } from "@dbp/scoring";
import { store } from "../store/in_memory.js";

// Admin routes are deliberately minimal in MVP. Real deployments put these
// behind a separate admin auth realm with MFA (spec §9, §15).

let rankingWeights = { ...DEFAULT_RANKING_WEIGHTS };

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, reply) => {
    const token = req.headers["x-admin-token"];
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) {
      // In dev the admin realm is open; in prod we refuse to boot without ADMIN_TOKEN.
      if (process.env.NODE_ENV === "production") {
        return reply.status(503).send({ error: { code: "admin_disabled", message: "admin realm not configured" } });
      }
      return;
    }
    if (token !== expected) {
      return reply.status(401).send({ error: { code: "unauthorized", message: "invalid admin token" } });
    }
  });

  app.get("/data-health", { schema: { tags: ["admin"] } }, async () => {
    const oldestOdds = [...store.oddsByMarket.values()]
      .flat()
      .reduce<number | null>((min, o) => {
        const t = Date.parse(o.capturedAt);
        return min === null || t < min ? t : min;
      }, null);
    return {
      events: store.events.size,
      recommendations: store.recommendations.size,
      oldestOddsSnapshotAt: oldestOdds ? new Date(oldestOdds).toISOString() : null,
      newsItems: store.news.size,
      injuries: store.injuries.size,
    };
  });

  app.get("/scoring-weights", { schema: { tags: ["admin"] } }, async () => ({ weights: rankingWeights }));
  app.post("/scoring-weights", { schema: { tags: ["admin"] } }, async (req) => {
    const body = z
      .object({
        winProbability: z.number().min(0).max(1).optional(),
        edge: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
        risk: z.number().min(0).max(1).optional(),
        volatility: z.number().min(0).max(1).optional(),
      })
      .parse(req.body ?? {});
    rankingWeights = { ...rankingWeights, ...body };
    return { weights: rankingWeights };
  });

  app.get("/audit-logs", { schema: { tags: ["admin"] } }, async () => ({ logs: [] }));
}
