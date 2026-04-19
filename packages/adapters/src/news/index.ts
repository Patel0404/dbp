export { MockNewsProvider } from "./mock.js";

import type { NewsItem, NewsEntity } from "@dbp/shared";

// Very lightweight sentiment classifier. Real deployments plug in a proper NLP
// pipeline — this stub demonstrates the required output shape and how upstream
// features consume it.

const POSITIVE = ["cleared", "return", "back", "wins", "wins mvp", "healthy", "upgraded", "strong form"];
const NEGATIVE = ["injury", "out", "doubtful", "questionable", "suspended", "scratched", "ruled out", "fined"];

export function classifyNewsText(text: string): { impact: NewsItem["impact"]; sentiment: NewsItem["sentiment"]; confidence: number } {
  const lower = text.toLowerCase();
  let pos = 0;
  let neg = 0;
  for (const w of POSITIVE) if (lower.includes(w)) pos += 1;
  for (const w of NEGATIVE) if (lower.includes(w)) neg += 1;
  if (pos === 0 && neg === 0) {
    return { impact: "uncertain", sentiment: "uncertain", confidence: 0.4 };
  }
  if (pos > neg) return { impact: "positive", sentiment: "positive", confidence: 0.5 + 0.1 * (pos - neg) };
  if (neg > pos) return { impact: "negative", sentiment: "negative", confidence: 0.5 + 0.1 * (neg - pos) };
  return { impact: "uncertain", sentiment: "uncertain", confidence: 0.5 };
}

export function extractEntities(_text: string): NewsEntity[] {
  // Real deployments wire a NER model here. The mock provider attaches entities
  // directly, so this is only a placeholder for production adapters.
  return [];
}
