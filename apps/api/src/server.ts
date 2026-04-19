import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config.js";
import { registerRoutes } from "./routes/index.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      transport: process.stdout.isTTY
        ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss" } }
        : undefined,
    },
    ajv: { customOptions: { removeAdditional: "all" } },
  });

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: config.corsOrigins, credentials: true });
  await app.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: `${config.rateLimitWindowSec} seconds`,
  });
  await app.register(swagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "DBP Sports Betting API",
        version: "0.1.0",
        description:
          "Advisory-mode sports betting recommendation API. Real-money features are gated by jurisdiction and compliance.",
      },
      servers: [{ url: `http://localhost:${config.port}` }],
      tags: [
        { name: "recommendations" },
        { name: "events" },
        { name: "news" },
        { name: "performance" },
        { name: "execution" },
        { name: "compliance" },
        { name: "admin" },
      ],
    },
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.addHook("onRequest", (req, reply, done) => {
    req.log.debug({ url: req.url, method: req.method }, "incoming");
    done();
  });

  await registerRoutes(app);

  app.setErrorHandler((err, req, reply) => {
    req.log.error({ err });
    const status = err.statusCode ?? 500;
    reply.status(status).send({ error: { code: err.code ?? "internal", message: err.message } });
  });

  return app;
}
