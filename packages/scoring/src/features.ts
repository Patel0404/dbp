// Feature engineering. Each feature is pure: it takes a bundle of inputs and
// returns a named numeric signal in a well-defined range. The model layer
// composes these; the explainability layer reads the same names.

import type {
  Event,
  Injury,
  NewsItem,
  OddsMovement,
  Team,
} from "@dbp/shared";

export interface TeamForm {
  teamId: string;
  last10WinPct: number; // 0..1
  offensiveEfficiency: number; // league-normalised, 0..1
  defensiveEfficiency: number; // 0..1
  restDays: number;
  travelMiles: number;
  homeWinPct: number; // 0..1
  awayWinPct: number; // 0..1
}

export interface FeatureInputs {
  event: Event;
  home: Team;
  away: Team;
  homeForm: TeamForm;
  awayForm: TeamForm;
  injuries: Injury[]; // for both sides
  news: NewsItem[]; // filtered to event entities
  movement?: OddsMovement;
}

export interface FeatureVector {
  // Fundamentals
  formGap: number; // -1..1, home positive
  offDefGap: number;
  restGap: number;
  travelGap: number;
  homeAdvantage: number; // 0..0.1 typical

  // Injury severity (higher = more hurt)
  homeInjuryImpact: number;
  awayInjuryImpact: number;
  injuryGap: number; // away - home (positive = home favoured)

  // News
  newsSentimentGap: number; // -1..1
  newsVolatility: number; // 0..1

  // Market
  lineSteam: number; // 0..1
  reverseLineMovement: number; // 0 or 1
  lineMoveMagnitude: number; // normalised delta
}

const INJURY_STATUS_WEIGHT: Record<Injury["status"], number> = {
  out: 1.0,
  doubtful: 0.7,
  questionable: 0.4,
  probable: 0.15,
  active: 0,
};

export function injuryImpactForTeam(injuries: Injury[], teamPlayerIds: Set<string>): number {
  let impact = 0;
  for (const inj of injuries) {
    if (!teamPlayerIds.has(inj.playerId)) continue;
    impact += INJURY_STATUS_WEIGHT[inj.status] * inj.severity;
  }
  // Diminishing returns — multiple injuries matter less per additional one.
  return 1 - Math.exp(-impact);
}

export function newsSignal(news: NewsItem[], teamId: string): { sentiment: number; volatility: number } {
  if (news.length === 0) return { sentiment: 0, volatility: 0 };
  let weighted = 0;
  let totalWeight = 0;
  for (const n of news) {
    if (!n.entities.some((e) => e.kind === "team" && e.id === teamId)) continue;
    const direction = n.impact === "positive" ? 1 : n.impact === "negative" ? -1 : 0;
    const weight = n.sourceCredibility * n.relevance * n.confidence;
    weighted += direction * weight;
    totalWeight += weight;
  }
  const sentiment = totalWeight === 0 ? 0 : weighted / totalWeight;
  const volatility = Math.min(1, news.reduce((s, n) => s + n.urgency * n.relevance, 0) / 3);
  return { sentiment, volatility };
}

export function buildFeatures(input: FeatureInputs, teamPlayerIndex: Record<string, Set<string>>): FeatureVector {
  const { homeForm, awayForm, home, away, injuries, news, movement } = input;

  const formGap = clamp(homeForm.last10WinPct - awayForm.last10WinPct, -1, 1);
  const offDefGap = clamp(
    (homeForm.offensiveEfficiency - awayForm.defensiveEfficiency) -
      (awayForm.offensiveEfficiency - homeForm.defensiveEfficiency),
    -1,
    1,
  );
  const restGap = clamp((homeForm.restDays - awayForm.restDays) / 3, -1, 1);
  const travelGap = clamp((awayForm.travelMiles - homeForm.travelMiles) / 3000, -1, 1);
  const homeAdvantage = 0.03; // sport-configurable; small default

  const homePlayerIds = teamPlayerIndex[home.id] ?? new Set<string>();
  const awayPlayerIds = teamPlayerIndex[away.id] ?? new Set<string>();
  const homeInjuryImpact = injuryImpactForTeam(injuries, homePlayerIds);
  const awayInjuryImpact = injuryImpactForTeam(injuries, awayPlayerIds);
  const injuryGap = awayInjuryImpact - homeInjuryImpact;

  const homeNews = newsSignal(news, home.id);
  const awayNews = newsSignal(news, away.id);
  const newsSentimentGap = clamp(homeNews.sentiment - awayNews.sentiment, -1, 1);
  const newsVolatility = clamp((homeNews.volatility + awayNews.volatility) / 2, 0, 1);

  const lineSteam = movement?.steamScore ?? 0;
  const reverseLineMovement = movement?.reverseLineMovement ? 1 : 0;
  const lineMoveMagnitude = movement
    ? clamp(Math.abs(movement.deltaAmerican) / 150, 0, 1)
    : 0;

  return {
    formGap,
    offDefGap,
    restGap,
    travelGap,
    homeAdvantage,
    homeInjuryImpact,
    awayInjuryImpact,
    injuryGap,
    newsSentimentGap,
    newsVolatility,
    lineSteam,
    reverseLineMovement,
    lineMoveMagnitude,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
