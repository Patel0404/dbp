import { test } from "node:test";
import assert from "node:assert/strict";
import { runBacktest } from "./runner.ts";

test("perfect predictions score low brier and positive ROI", () => {
  const rows = Array.from({ length: 100 }, () => ({
    prediction: { predictedProbability: 0.9, expectedValue: 0 },
    decimalOdds: 2.0,
    outcome: "win" as const,
  }));
  const r = runBacktest(rows);
  assert.equal(r.n, 100);
  assert.equal(r.hitRate, 1);
  assert.ok(r.brier < 0.02);
  assert.ok(r.roiFlatUnit > 0.99);
});

test("random 50/50 gives roughly 0 ROI at even odds", () => {
  const rows = Array.from({ length: 1000 }, (_, i) => ({
    prediction: { predictedProbability: 0.5, expectedValue: 0 },
    decimalOdds: 2.0,
    outcome: i % 2 === 0 ? ("win" as const) : ("loss" as const),
  }));
  const r = runBacktest(rows);
  assert.ok(Math.abs(r.roiFlatUnit) < 0.05);
  assert.ok(r.brier > 0.2 && r.brier < 0.3);
});
