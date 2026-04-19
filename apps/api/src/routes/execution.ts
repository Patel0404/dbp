import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { gateExecution } from "@dbp/adapters";
import type { UserCompliance } from "@dbp/shared";
import { store } from "../store/in_memory.js";
import { config } from "../config.js";
import { resolveExecutionProvider } from "../services/provider_registry.js";

// In MVP advisory mode, execution endpoints exist but always reject unless the
// operator explicitly flips the product to an execution mode AND the user's
// jurisdiction and KYC allow it. This mirrors the spec's section 5 + 14.

const PreviewBody = z.object({
  recommendationId: z.string(),
  stakeUnits: z.number().positive().max(10),
  userId: z.string().default("demo-user"),
  jurisdictionCode: z.string().default("US-NJ"),
});

export async function executionRoutes(app: FastifyInstance) {
  app.post(
    "/execution/preview",
    { schema: { tags: ["execution"] } },
    async (req, reply) => {
      const body = PreviewBody.parse(req.body);
      const rec = store.recommendations.get(body.recommendationId);
      if (!rec) return reply.status(404).send({ error: { code: "not_found", message: "recommendation not found" } });

      const user = demoUser(body.userId);
      const jurisdiction = store.jurisdictions.get(body.jurisdictionCode);
      const gate = gateExecution({
        requestedMode: config.productMode,
        user,
        jurisdiction,
        globalKillSwitch: config.globalKillSwitch,
      });
      if (!gate.allowed) {
        return reply.status(403).send({
          error: { code: "execution_gated", message: "real-money execution not permitted", reason: gate.reason },
        });
      }

      const { provider, key } = await resolveExecutionProvider();
      const preview = await provider.previewBet({
        marketId: rec.marketId,
        side: rec.side,
        stakeUnits: body.stakeUnits,
        bookmakerId: rec.bookmakerId,
        userId: body.userId,
        jurisdictionCode: body.jurisdictionCode,
      });
      return { preview, gate, provider: key };
    },
  );

  app.post(
    "/execution/place",
    { schema: { tags: ["execution"] } },
    async (req, reply) => {
      const body = PreviewBody.extend({ idempotencyKey: z.string() }).parse(req.body);
      const rec = store.recommendations.get(body.recommendationId);
      if (!rec) return reply.status(404).send({ error: { code: "not_found", message: "recommendation not found" } });

      const user = demoUser(body.userId);
      const jurisdiction = store.jurisdictions.get(body.jurisdictionCode);
      const gate = gateExecution({
        requestedMode: config.productMode,
        user,
        jurisdiction,
        globalKillSwitch: config.globalKillSwitch,
      });
      if (!gate.allowed) {
        return reply.status(403).send({
          error: { code: "execution_gated", message: "real-money execution not permitted", reason: gate.reason },
        });
      }
      const { provider, key } = await resolveExecutionProvider();
      const result = await provider.placeBet({
        marketId: rec.marketId,
        side: rec.side,
        stakeUnits: body.stakeUnits,
        bookmakerId: rec.bookmakerId,
        userId: body.userId,
        jurisdictionCode: body.jurisdictionCode,
        idempotencyKey: body.idempotencyKey,
      });
      return { result, gate, provider: key };
    },
  );
}

function demoUser(userId: string): UserCompliance {
  return {
    userId,
    jurisdictionCode: "US-NJ",
    ageVerified: false,
    identityVerified: false,
  };
}
