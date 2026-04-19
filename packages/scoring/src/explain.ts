import type { ExplanationFactor, Injury, NewsItem, OddsMovement, Team } from "@dbp/shared";
import type { FeatureVector } from "./features.js";
import type { ModelOutput } from "./model.js";

const FEATURE_LABELS: Record<keyof FeatureVector, string> = {
  formGap: "Recent form",
  offDefGap: "Matchup efficiency",
  restGap: "Rest advantage",
  travelGap: "Travel advantage",
  homeAdvantage: "Home-field edge",
  homeInjuryImpact: "Home injuries",
  awayInjuryImpact: "Away injuries",
  injuryGap: "Injury differential",
  newsSentimentGap: "News sentiment",
  newsVolatility: "News volatility",
  lineSteam: "Line steam",
  reverseLineMovement: "Reverse line movement",
  lineMoveMagnitude: "Line movement magnitude",
};

export function factorsFromModelOutput(output: ModelOutput, topN = 4): ExplanationFactor[] {
  const maxContribution = output.contributions.reduce((m, c) => Math.max(m, Math.abs(c.contribution)), 0) || 1;
  return output.contributions.slice(0, topN).map((c) => ({
    key: c.feature,
    label: FEATURE_LABELS[c.feature],
    valueText: describeValue(c.feature, c.value),
    direction: c.contribution > 0 ? "for" : c.contribution < 0 ? "against" : "neutral",
    weight: Number((Math.abs(c.contribution) / maxContribution).toFixed(3)),
  }));
}

export function describeValue(feature: keyof FeatureVector, value: number): string {
  switch (feature) {
    case "formGap":
    case "offDefGap":
    case "newsSentimentGap":
      return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
    case "restGap":
      return `${(value * 3).toFixed(1)} days`;
    case "travelGap":
      return `${Math.round(value * 3000)} mi`;
    case "homeAdvantage":
      return `+${(value * 100).toFixed(1)}%`;
    case "homeInjuryImpact":
    case "awayInjuryImpact":
    case "newsVolatility":
    case "lineSteam":
      return `${(value * 100).toFixed(0)}%`;
    case "reverseLineMovement":
      return value > 0.5 ? "yes" : "no";
    case "lineMoveMagnitude":
      return `${Math.round(value * 150)} pts`;
    case "injuryGap":
      return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  }
}

export function summarise(params: {
  homeTeam: Team;
  awayTeam: Team;
  side: "home" | "away" | string;
  predictedProbability: number;
  impliedProbability: number;
  factors: ExplanationFactor[];
}): string {
  const sideLabel = params.side === "home" ? params.homeTeam.name : params.side === "away" ? params.awayTeam.name : params.side;
  const pModel = (params.predictedProbability * 100).toFixed(1);
  const pMarket = (params.impliedProbability * 100).toFixed(1);
  const topFor = params.factors.find((f) => f.direction === "for");
  const reason = topFor ? `${topFor.label.toLowerCase()} favours the pick (${topFor.valueText})` : "edge is small but positive";
  return `Model favours ${sideLabel} at ${pModel}% vs market implied ${pMarket}% — ${reason}.`;
}

export function injuryNotes(injuries: Injury[], teamPlayerIndex: Record<string, { teamName: string; playerIndex: Record<string, string> }>): string[] {
  return injuries
    .filter((i) => i.status === "out" || i.status === "doubtful")
    .map((i) => {
      for (const team of Object.values(teamPlayerIndex)) {
        if (team.playerIndex[i.playerId]) {
          return `${team.teamName}: ${team.playerIndex[i.playerId]} ${i.status}${i.designation ? ` (${i.designation})` : ""}`;
        }
      }
      return `Player ${i.playerId} ${i.status}`;
    });
}

export function lineMovementNote(move: OddsMovement | undefined): string | undefined {
  if (!move) return undefined;
  const direction = move.deltaAmerican > 0 ? "lengthened" : "shortened";
  const magnitude = Math.abs(move.deltaAmerican);
  const steam = move.steamScore > 0.6 ? " with heavy steam" : "";
  const rlm = move.reverseLineMovement ? " (reverse line movement)" : "";
  return `Line ${direction} ${magnitude} pts from open${steam}${rlm}.`;
}

export function newsSummary(news: NewsItem[]): string[] {
  return news
    .filter((n) => n.relevance > 0.5 && n.confidence > 0.4)
    .slice(0, 3)
    .map((n) => `${n.source}: ${n.headline}`);
}
