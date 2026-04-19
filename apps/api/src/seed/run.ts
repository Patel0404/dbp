import { store } from "../store/in_memory.js";
import * as fixtures from "./fixtures.js";

export function seed(): void {
  for (const s of fixtures.sports) store.sports.set(s.id, s);
  for (const l of fixtures.leagues) store.leagues.set(l.id, l);
  for (const t of fixtures.teams) store.addTeam(t);
  for (const p of fixtures.players) store.addPlayer(p);
  for (const e of fixtures.events) store.events.set(e.id, e);
  for (const b of fixtures.bookmakers) store.bookmakers.set(b.id, b);
  for (const m of fixtures.markets) store.addMarket(m);
  for (const o of fixtures.oddsSnapshots) store.addOdds(o);
  for (const mv of fixtures.oddsMovements) {
    const list = store.movementsByMarket.get(mv.marketId) ?? [];
    list.push(mv);
    store.movementsByMarket.set(mv.marketId, list);
  }
  for (const i of fixtures.injuries) store.injuries.set(i.id, i);
  for (const n of fixtures.news) store.news.set(n.id, n);
  for (const j of fixtures.jurisdictions) store.jurisdictions.set(j.code, j);
  for (const [teamId, form] of Object.entries(fixtures.teamForms)) {
    store.teamForms.set(teamId, form);
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
  console.log("Seeded in-memory store:", {
    sports: store.sports.size,
    events: store.events.size,
    markets: store.markets.size,
    odds: [...store.oddsByMarket.values()].reduce((s, v) => s + v.length, 0),
    news: store.news.size,
    injuries: store.injuries.size,
  });
}
