import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { store } from "../store/in_memory.js";
import { generateRecommendations } from "../services/recommendations.js";
import type { TopPick } from "@dbp/shared";

const TopPicksQuery = z.object({
  sport: z.string().optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
  minEdge: z.coerce.number().optional(),
  category: z
    .enum(["highest_win_probability", "best_value", "safest", "contrarian", "live", "news_driven"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function recommendationsRoutes(app: FastifyInstance) {
  app.get(
    "/top-picks",
    {
      schema: {
        tags: ["recommendations"],
        description: "Highest-ranked bet recommendations, sorted by rank_score desc.",
        querystring: {
          type: "object",
          properties: {
            sport: { type: "string" },
            minConfidence: { type: "number" },
            minEdge: { type: "number" },
            category: { type: "string" },
            limit: { type: "integer" },
          },
        },
      },
    },
    async (req) => {
      const query = TopPicksQuery.parse(req.query);
      const refreshed = generateRecommendations();
      const filtered = refreshed
        .filter((p) => applyFilters(p, query))
        .slice(0, query.limit);
      return { picks: filtered, refreshedAt: new Date().toISOString() };
    },
  );

  app.get(
    "/recommendations/:id",
    { schema: { tags: ["recommendations"] } },
    async (req, reply) => {
      const params = z.object({ id: z.string() }).parse(req.params);
      const rec = store.recommendations.get(params.id);
      if (!rec) return reply.status(404).send({ error: { code: "not_found", message: "recommendation not found" } });
      const pred = store.predictions.get(rec.predictionId);
      const event = store.events.get(rec.eventId);
      const market = store.markets.get(rec.marketId);
      const bookmaker = store.bookmakers.get(rec.bookmakerId);
      return { recommendation: rec, prediction: pred, event, market, bookmaker };
    },
  );

  app.get("/recommendations", { schema: { tags: ["recommendations"] } }, async (req) => {
    const query = TopPicksQuery.parse(req.query);
    const picks = generateRecommendations().filter((p) => applyFilters(p, query));
    return { recommendations: picks.map((p) => p.recommendation) };
  });
}

function applyFilters(p: TopPick, q: z.infer<typeof TopPicksQuery>): boolean {
  if (q.minConfidence !== undefined && p.prediction.confidence < q.minConfidence) return false;
  if (q.minEdge !== undefined && p.prediction.edge < q.minEdge) return false;
  if (q.category && p.recommendation.category !== q.category) return false;
  if (q.sport) {
    const league = store.leagues.get(p.event.leagueId);
    const sport = league ? store.sports.get(league.sportId) : undefined;
    if (sport?.key !== q.sport) return false;
  }
  return true;
}
