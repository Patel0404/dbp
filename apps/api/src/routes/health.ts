import type { FastifyInstance } from "fastify";
import { store } from "../store/in_memory.js";

export async function healthRoutes(app: FastifyInstance) {
  app.get("/healthz", { schema: { tags: ["admin"] } }, async () => ({ ok: true }));
  app.get("/readyz", { schema: { tags: ["admin"] } }, async () => {
    const dataLoaded = store.events.size > 0 && store.recommendations.size > 0;
    return { ok: dataLoaded, events: store.events.size, recommendations: store.recommendations.size };
  });
}
