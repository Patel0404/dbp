import type { FastifyInstance } from "fastify";
import { store } from "../store/in_memory.js";

// MVP performance endpoint returns a stubbed rolling record. Once bets are
// actually placed (or reconciled), this is computed from the `bets` table.
export async function performanceRoutes(app: FastifyInstance) {
  app.get("/performance", { schema: { tags: ["performance"] } }, async () => {
    const totalRecs = store.recommendations.size;
    // Stubbed historical numbers until real bet reconciliation is wired up.
    return {
      summary: {
        totalRecommendations: totalRecs,
        hitRate: 0.548,
        roi: 0.042,
        avgEdge: 0.031,
        avgClosingLineValue: 0.012,
        modelVersion: "moneyline-v1",
        sampleSize: 612,
      },
      byDay: Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - (13 - i) * 86400_000).toISOString().slice(0, 10),
        recommendations: 12 + Math.round(Math.sin(i) * 3),
        hitRate: 0.5 + Math.sin(i / 2) * 0.05,
        roi: 0.03 + Math.sin(i / 3) * 0.04,
      })),
      bySport: [
        { sport: "nba", hitRate: 0.56, roi: 0.051 },
        { sport: "nfl", hitRate: 0.54, roi: 0.028 },
        { sport: "epl", hitRate: 0.52, roi: 0.035 },
      ],
      warning:
        "Past performance does not guarantee future results. Model probabilities are estimates.",
    };
  });
}
