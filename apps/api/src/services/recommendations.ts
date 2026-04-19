import type {
  Event,
  Market,
  NewsItem,
  OddsMovement,
  OddsSnapshot,
  Prediction,
  Recommendation,
  Team,
  TopPick,
} from "@dbp/shared";
import {
  buildFeatures,
  categorise,
  DEFAULT_MONEYLINE_COEFFICIENTS,
  DEFAULT_RANKING_WEIGHTS,
  factorsFromModelOutput,
  injuryNotes,
  lineMovementNote,
  newsSummary,
  predict,
  rankScore,
  recommendStake,
  summarise,
  type TeamForm,
} from "@dbp/scoring";
import { devigTwoWay, expectedValueUnits } from "@dbp/shared";
import { store } from "../store/in_memory.js";

const MODEL_VERSION = "moneyline-v1";
const RECOMMENDATION_TTL_MINUTES = 30;

interface BuildContext {
  generatedAt: string;
  dataRefreshedAt: string;
}

export function generateRecommendations(ctx: BuildContext = makeCtx()): TopPick[] {
  const picks: TopPick[] = [];
  for (const event of store.events.values()) {
    if (event.status !== "scheduled") continue;
    const marketIds = store.marketsByEvent.get(event.id) ?? new Set();
    for (const marketId of marketIds) {
      const market = store.markets.get(marketId);
      if (!market || market.type !== "moneyline") continue;
      const pick = scoreMoneyline(event, market, ctx);
      if (pick) picks.push(pick);
    }
  }
  return picks.sort((a, b) => b.recommendation.rankScore - a.recommendation.rankScore);
}

function scoreMoneyline(event: Event, market: Market, ctx: BuildContext): TopPick | undefined {
  const home = store.teams.get(event.homeTeamId);
  const away = store.teams.get(event.awayTeamId);
  if (!home || !away) return undefined;

  const homeForm = store.teamForms.get(home.id) as TeamForm | undefined;
  const awayForm = store.teamForms.get(away.id) as TeamForm | undefined;
  if (!homeForm || !awayForm) return undefined;

  const latest = store.latestOdds(market.id);
  if (latest.length < 2) return undefined;
  const homeBest = pickBestPrice(latest, "home");
  const awayBest = pickBestPrice(latest, "away");
  if (!homeBest || !awayBest) return undefined;

  const teamPlayerIndex: Record<string, Set<string>> = {
    [home.id]: store.playersByTeam.get(home.id) ?? new Set(),
    [away.id]: store.playersByTeam.get(away.id) ?? new Set(),
  };

  const relevantNews: NewsItem[] = [...store.news.values()].filter((n) =>
    n.entities.some((e) => e.kind === "event" && e.id === event.id),
  );
  const eventInjuries = [...store.injuries.values()].filter((inj) => {
    const p = store.players.get(inj.playerId);
    return p && (p.teamId === home.id || p.teamId === away.id);
  });

  const movement = (store.movementsByMarket.get(market.id) ?? []).find((m) => m.side === "home");

  const features = buildFeatures(
    { event, home, away, homeForm, awayForm, injuries: eventInjuries, news: relevantNews, movement },
    teamPlayerIndex,
  );

  const output = predict(features, DEFAULT_MONEYLINE_COEFFICIENTS);
  const homeProb = output.probability;

  // Devig the market pair so we compare apples to apples.
  const { pA: trueHome, pB: trueAway } = devigTwoWay(
    homeBest.impliedProbability,
    awayBest.impliedProbability,
  );

  const homeEdge = homeProb - trueHome;
  const awayEdge = 1 - homeProb - trueAway;

  // Whichever side has the larger positive edge wins the pick. If neither has
  // edge we skip the market entirely so we don't surface junk.
  const preferHome = homeEdge >= awayEdge;
  const chosen = preferHome ? homeBest : awayBest;
  const edge = preferHome ? homeEdge : awayEdge;
  if (edge <= 0) return undefined;

  const predictedProb = preferHome ? homeProb : 1 - homeProb;
  const ev = expectedValueUnits(predictedProb, chosen.decimalOdds);
  const confidence = computeConfidence(features, relevantNews.length, movement);
  const risk = computeRisk(features);
  const newsStability = 1 - Math.min(1, relevantNews.reduce((s, n) => s + n.urgency * n.relevance, 0) / 3);
  const lineVolatility = movement ? Math.min(1, Math.abs(movement.deltaAmerican) / 100) : 0;

  const stake = recommendStake({
    predictedProbability: predictedProb,
    decimalOdds: chosen.decimalOdds,
    confidence,
    riskTolerance: "balanced",
    maxPerBetUnits: 3,
  });

  const factors = factorsFromModelOutput(output);
  // If we picked the away side, flip the feature narrative direction.
  const flippedFactors = preferHome
    ? factors
    : factors.map((f) => {
        const direction: "for" | "against" | "neutral" =
          f.direction === "for" ? "against" : f.direction === "against" ? "for" : "neutral";
        return { ...f, direction };
      });

  const prediction: Prediction = {
    id: `pred-${market.id}`,
    modelVersion: MODEL_VERSION,
    marketId: market.id,
    side: preferHome ? "home" : "away",
    predictedProbability: predictedProb,
    marketImpliedProbability: preferHome ? trueHome : trueAway,
    edge,
    expectedValue: ev,
    confidence,
    risk,
    newsStability,
    lineVolatility,
    recommendedUnitsMin: stake.minUnits,
    recommendedUnitsMax: stake.maxUnits,
    contributingFactors: flippedFactors,
    generatedAt: ctx.generatedAt,
    dataRefreshedAt: ctx.dataRefreshedAt,
  };

  store.predictions.set(prediction.id, prediction);

  const summary = summarise({
    homeTeam: home,
    awayTeam: away,
    side: prediction.side,
    predictedProbability: predictedProb,
    impliedProbability: preferHome ? trueHome : trueAway,
    factors: flippedFactors,
  });

  const teamPlayerNameIndex: Record<string, { teamName: string; playerIndex: Record<string, string> }> = {
    [home.id]: { teamName: home.name, playerIndex: {} },
    [away.id]: { teamName: away.name, playerIndex: {} },
  };
  for (const p of store.players.values()) {
    const bucket = teamPlayerNameIndex[p.teamId];
    if (bucket) bucket.playerIndex[p.id] = p.name;
  }

  const recommendation: Recommendation = {
    id: `rec-${market.id}`,
    predictionId: prediction.id,
    eventId: event.id,
    marketId: market.id,
    bookmakerId: chosen.bookmakerId,
    side: prediction.side,
    rankScore: rankScore(prediction, DEFAULT_RANKING_WEIGHTS),
    category: categorise(prediction),
    explanation: {
      summary,
      keyFactors: flippedFactors,
      injuryNotes: injuryNotes(eventInjuries, teamPlayerNameIndex),
      lineMovementNote: lineMovementNote(movement),
      historicalNote: describeForm(homeForm, awayForm, home, away),
      riskWarning:
        "Model probabilities are estimates, not guarantees. Never wager more than you can afford to lose.",
      dataRefreshedAt: ctx.dataRefreshedAt,
    },
    createdAt: ctx.generatedAt,
    expiresAt: new Date(Date.parse(ctx.generatedAt) + RECOMMENDATION_TTL_MINUTES * 60_000).toISOString(),
  };
  store.recommendations.set(recommendation.id, recommendation);

  const bookmaker = store.bookmakers.get(chosen.bookmakerId);
  if (!bookmaker) return undefined;
  return {
    recommendation,
    prediction,
    event,
    home,
    away,
    market,
    bookmaker,
    odds: chosen,
  };
}

function pickBestPrice(snapshots: OddsSnapshot[], side: "home" | "away"): OddsSnapshot | undefined {
  const filtered = snapshots.filter((s) => s.side === side);
  if (filtered.length === 0) return undefined;
  return filtered.reduce((best, s) => (s.decimalOdds > best.decimalOdds ? s : best));
}

function computeConfidence(
  features: { newsVolatility: number; lineSteam: number },
  newsCount: number,
  movement: OddsMovement | undefined,
): number {
  // More data => higher confidence; more volatility => lower.
  let c = 0.55;
  c += Math.min(0.15, newsCount * 0.05);
  c += Math.min(0.15, features.lineSteam * 0.2);
  c -= features.newsVolatility * 0.2;
  if (movement && movement.reverseLineMovement) c += 0.05;
  return Math.max(0, Math.min(1, c));
}

function computeRisk(features: {
  lineMoveMagnitude: number;
  newsVolatility: number;
  homeInjuryImpact: number;
  awayInjuryImpact: number;
}): number {
  return Math.min(
    1,
    0.15 +
      0.4 * features.lineMoveMagnitude +
      0.35 * features.newsVolatility +
      0.25 * Math.max(features.homeInjuryImpact, features.awayInjuryImpact),
  );
}

function describeForm(home: TeamForm, away: TeamForm, homeTeam: Team, awayTeam: Team): string {
  const hw = Math.round(home.last10WinPct * 10);
  const aw = Math.round(away.last10WinPct * 10);
  return `${homeTeam.shortName} ${hw}-${10 - hw} last 10, ${awayTeam.shortName} ${aw}-${10 - aw}.`;
}

function makeCtx(): BuildContext {
  const iso = new Date().toISOString();
  return { generatedAt: iso, dataRefreshedAt: iso };
}
