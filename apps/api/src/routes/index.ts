import type { FastifyInstance } from "fastify";
import { recommendationsRoutes } from "./recommendations.js";
import { eventsRoutes } from "./events.js";
import { newsRoutes } from "./news.js";
import { performanceRoutes } from "./performance.js";
import { executionRoutes } from "./execution.js";
import { complianceRoutes } from "./compliance.js";
import { healthRoutes } from "./health.js";
import { adminRoutes } from "./admin.js";

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(recommendationsRoutes, { prefix: "/v1" });
  await app.register(eventsRoutes, { prefix: "/v1" });
  await app.register(newsRoutes, { prefix: "/v1" });
  await app.register(performanceRoutes, { prefix: "/v1" });
  await app.register(executionRoutes, { prefix: "/v1" });
  await app.register(complianceRoutes, { prefix: "/v1" });
  await app.register(adminRoutes, { prefix: "/v1/admin" });
}
