// Minimal deterministic backtest runner. Replays a set of historical events
// through the scoring engine and reports calibration-oriented metrics
// (Brier, log loss, hit rate, ROI at flat stake) so the model deployment gate
// required by spec §13 has something to evaluate.

import type { Prediction } from "@dbp/shared";

export interface BacktestRow {
  prediction: Pick<Prediction, "predictedProbability" | "expectedValue">;
  decimalOdds: number;
  outcome: "win" | "loss" | "push";
}

export interface BacktestReport {
  n: number;
  hitRate: number;
  roiFlatUnit: number;
  brier: number;
  logLoss: number;
  calibrationBuckets: Array<{ bucket: string; predicted: number; actual: number; count: number }>;
}

export function runBacktest(rows: BacktestRow[]): BacktestReport {
  if (rows.length === 0) {
    return { n: 0, hitRate: 0, roiFlatUnit: 0, brier: 0, logLoss: 0, calibrationBuckets: [] };
  }
  let wins = 0;
  let profit = 0;
  let brier = 0;
  let logLoss = 0;
  const buckets = new Map<string, { predicted: number; actual: number; count: number }>();

  for (const row of rows) {
    const p = row.prediction.predictedProbability;
    const y = row.outcome === "win" ? 1 : 0;
    if (row.outcome === "win") {
      wins += 1;
      profit += row.decimalOdds - 1;
    } else if (row.outcome === "loss") {
      profit -= 1;
    }
    brier += (p - y) ** 2;
    logLoss += -(y * Math.log(Math.max(p, 1e-9)) + (1 - y) * Math.log(Math.max(1 - p, 1e-9)));

    const bucketKey = bucketOf(p);
    const entry = buckets.get(bucketKey) ?? { predicted: 0, actual: 0, count: 0 };
    entry.predicted += p;
    entry.actual += y;
    entry.count += 1;
    buckets.set(bucketKey, entry);
  }

  const calibrationBuckets = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucket, v]) => ({
      bucket,
      predicted: v.predicted / v.count,
      actual: v.actual / v.count,
      count: v.count,
    }));

  return {
    n: rows.length,
    hitRate: wins / rows.length,
    roiFlatUnit: profit / rows.length,
    brier: brier / rows.length,
    logLoss: logLoss / rows.length,
    calibrationBuckets,
  };
}

function bucketOf(p: number): string {
  // 10-wide buckets from 0-10% up to 90-100%.
  const lo = Math.min(0.9, Math.floor(p * 10) / 10);
  const hi = lo + 0.1;
  return `${(lo * 100).toFixed(0)}-${(hi * 100).toFixed(0)}%`;
}
