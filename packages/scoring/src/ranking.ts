import type { Prediction, Recommendation, RecommendationCategory } from "@dbp/shared";

export interface RankingWeights {
  winProbability: number;
  edge: number;
  confidence: number;
  risk: number;
  volatility: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  winProbability: 0.35,
  edge: 0.35,
  confidence: 0.2,
  risk: 0.15,
  volatility: 0.1,
};

export function rankScore(p: Prediction, w: RankingWeights = DEFAULT_RANKING_WEIGHTS): number {
  return (
    w.winProbability * p.predictedProbability +
    w.edge * p.edge +
    w.confidence * p.confidence -
    w.risk * p.risk -
    w.volatility * p.lineVolatility
  );
}

export interface RecommendationFilters {
  minConfidence?: number;
  minEdge?: number;
  maxRisk?: number;
  sports?: string[];
  bookmakers?: string[];
  bettypes?: string[];
  oddsRange?: { minAmerican: number; maxAmerican: number };
}

export function categorise(p: Prediction): RecommendationCategory {
  if (p.newsStability < 0.5 && p.confidence > 0.5) return "news_driven";
  if (p.risk < 0.25 && p.confidence > 0.6) return "safest";
  if (p.edge > 0.08) return "best_value";
  if (p.predictedProbability > 0.65) return "highest_win_probability";
  return "contrarian";
}

export function sortAndFilterRecommendations(
  recs: Array<{ recommendation: Recommendation; prediction: Prediction }>,
  filters: RecommendationFilters = {},
): Array<{ recommendation: Recommendation; prediction: Prediction }> {
  return recs
    .filter(({ prediction }) => {
      if (filters.minConfidence !== undefined && prediction.confidence < filters.minConfidence) return false;
      if (filters.minEdge !== undefined && prediction.edge < filters.minEdge) return false;
      if (filters.maxRisk !== undefined && prediction.risk > filters.maxRisk) return false;
      return true;
    })
    .sort((a, b) => b.recommendation.rankScore - a.recommendation.rankScore);
}
