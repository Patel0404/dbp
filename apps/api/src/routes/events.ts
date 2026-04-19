import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { store } from "../store/in_memory.js";

export async function eventsRoutes(app: FastifyInstance) {
  app.get("/events", { schema: { tags: ["events"] } }, async (req) => {
    const query = z
      .object({ sport: z.string().optional(), status: z.string().optional() })
      .parse(req.query);
    const events = [...store.events.values()].filter((e) => {
      if (query.status && e.status !== query.status) return false;
      if (query.sport) {
        const league = store.leagues.get(e.leagueId);
        const sport = league ? store.sports.get(league.sportId) : undefined;
        if (sport?.key !== query.sport) return false;
      }
      return true;
    });
    return { events };
  });

  app.get("/events/:id", { schema: { tags: ["events"] } }, async (req, reply) => {
    const params = z.object({ id: z.string() }).parse(req.params);
    const event = store.events.get(params.id);
    if (!event) return reply.status(404).send({ error: { code: "not_found", message: "event not found" } });
    const home = store.teams.get(event.homeTeamId);
    const away = store.teams.get(event.awayTeamId);
    const markets = [...(store.marketsByEvent.get(event.id) ?? [])]
      .map((id) => store.markets.get(id))
      .filter(Boolean);
    const odds = markets.flatMap((m) => (m ? store.latestOdds(m.id) : []));
    return { event, home, away, markets, odds };
  });

  app.get("/sports", { schema: { tags: ["events"] } }, async () => ({
    sports: [...store.sports.values()],
  }));
}
