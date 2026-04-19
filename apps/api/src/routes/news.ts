import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { store } from "../store/in_memory.js";

export async function newsRoutes(app: FastifyInstance) {
  app.get("/news", { schema: { tags: ["news"] } }, async (req) => {
    const query = z
      .object({
        eventId: z.string().optional(),
        teamId: z.string().optional(),
        playerId: z.string().optional(),
        sinceIso: z.string().optional(),
        limit: z.coerce.number().int().min(1).max(200).default(50),
      })
      .parse(req.query);

    const since = query.sinceIso ? Date.parse(query.sinceIso) : 0;
    const items = [...store.news.values()]
      .filter((n) => Date.parse(n.publishedAt) >= since)
      .filter((n) =>
        query.eventId
          ? n.entities.some((e) => e.kind === "event" && e.id === query.eventId)
          : true,
      )
      .filter((n) =>
        query.teamId
          ? n.entities.some((e) => e.kind === "team" && e.id === query.teamId)
          : true,
      )
      .filter((n) =>
        query.playerId
          ? n.entities.some((e) => e.kind === "player" && e.id === query.playerId)
          : true,
      )
      .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
      .slice(0, query.limit);

    return { news: items };
  });
}
