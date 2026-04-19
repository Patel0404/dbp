import { buildServer } from "./server.js";
import { config } from "./config.js";
import { seed } from "./seed/run.js";
import { generateRecommendations } from "./services/recommendations.js";

async function main() {
  seed();
  generateRecommendations();

  const app = await buildServer();
  await app.listen({ host: config.host, port: config.port });
  app.log.info(`DBP API listening on http://${config.host}:${config.port}`);
  app.log.info(`OpenAPI docs at http://${config.host}:${config.port}/docs`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
