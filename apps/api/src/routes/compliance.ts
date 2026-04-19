import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { store } from "../store/in_memory.js";
import { config } from "../config.js";

export async function complianceRoutes(app: FastifyInstance) {
  app.get(
    "/compliance/jurisdictions",
    { schema: { tags: ["compliance"] } },
    async () => ({ jurisdictions: [...store.jurisdictions.values()] }),
  );

  app.get(
    "/compliance/jurisdictions/:code",
    { schema: { tags: ["compliance"] } },
    async (req, reply) => {
      const params = z.object({ code: z.string() }).parse(req.params);
      const rule = store.jurisdictions.get(params.code);
      if (!rule) return reply.status(404).send({ error: { code: "not_found", message: "jurisdiction not found" } });
      return rule;
    },
  );

  app.get(
    "/compliance/mode",
    { schema: { tags: ["compliance"] } },
    async () => ({
      productMode: config.productMode,
      globalKillSwitch: config.globalKillSwitch,
      notice:
        "Advisory mode only: this app provides recommendations. Real-money wagering is not enabled.",
    }),
  );
}
