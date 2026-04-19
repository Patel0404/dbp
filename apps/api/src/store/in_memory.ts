// In-memory store for MVP. Same interface the API layer uses, so swapping in a
// SQL-backed implementation is a one-file change. Repositories are plain maps
// with convenience accessors — no locking is required because the API is
// single-process for development.

import type {
  Bookmaker,
  Event,
  Injury,
  JurisdictionRule,
  League,
  Market,
  NewsItem,
  OddsMovement,
  OddsSnapshot,
  Player,
  Prediction,
  Recommendation,
  Sport,
  Team,
} from "@dbp/shared";

export class InMemoryStore {
  sports = new Map<string, Sport>();
  leagues = new Map<string, League>();
  teams = new Map<string, Team>();
  players = new Map<string, Player>();
  events = new Map<string, Event>();
  bookmakers = new Map<string, Bookmaker>();
  markets = new Map<string, Market>();
  oddsByMarket = new Map<string, OddsSnapshot[]>();
  movementsByMarket = new Map<string, OddsMovement[]>();
  injuries = new Map<string, Injury>();
  news = new Map<string, NewsItem>();
  predictions = new Map<string, Prediction>();
  recommendations = new Map<string, Recommendation>();
  jurisdictions = new Map<string, JurisdictionRule>();
  teamForms = new Map<string, unknown>(); // typed per consumer

  // Secondary indexes
  playersByTeam = new Map<string, Set<string>>();
  marketsByEvent = new Map<string, Set<string>>();
  teamsByLeague = new Map<string, Set<string>>();

  addPlayer(player: Player): void {
    this.players.set(player.id, player);
    let set = this.playersByTeam.get(player.teamId);
    if (!set) {
      set = new Set();
      this.playersByTeam.set(player.teamId, set);
    }
    set.add(player.id);
  }

  addMarket(market: Market): void {
    this.markets.set(market.id, market);
    let set = this.marketsByEvent.get(market.eventId);
    if (!set) {
      set = new Set();
      this.marketsByEvent.set(market.eventId, set);
    }
    set.add(market.id);
  }

  addTeam(team: Team): void {
    this.teams.set(team.id, team);
    let set = this.teamsByLeague.get(team.leagueId);
    if (!set) {
      set = new Set();
      this.teamsByLeague.set(team.leagueId, set);
    }
    set.add(team.id);
  }

  addOdds(snap: OddsSnapshot): void {
    const list = this.oddsByMarket.get(snap.marketId) ?? [];
    list.push(snap);
    this.oddsByMarket.set(snap.marketId, list);
  }

  latestOdds(marketId: string): OddsSnapshot[] {
    const all = this.oddsByMarket.get(marketId) ?? [];
    // Keep the latest per (bookmaker, side)
    const latest = new Map<string, OddsSnapshot>();
    for (const o of all) {
      const key = `${o.bookmakerId}:${o.side}`;
      const prev = latest.get(key);
      if (!prev || Date.parse(o.capturedAt) > Date.parse(prev.capturedAt)) {
        latest.set(key, o);
      }
    }
    return [...latest.values()];
  }
}

export const store = new InMemoryStore();
