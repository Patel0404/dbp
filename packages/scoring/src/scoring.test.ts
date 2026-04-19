import { test } from "node:test";
import assert from "node:assert/strict";
import { sigmoid, predict, DEFAULT_MONEYLINE_COEFFICIENTS } from "./model.ts";
import { injuryImpactForTeam } from "./features.ts";
import { recommendStake } from "./stakes.ts";
import { rankScore } from "./ranking.ts";
import {
  americanToDecimal,
  decimalToAmerican,
  devigTwoWay,
  expectedValueUnits,
  kellyFraction,
} from "@dbp/shared";

test("sigmoid is bounded in [0,1] and centered at 0.5", () => {
  assert.equal(sigmoid(0), 0.5);
  assert.ok(sigmoid(1000) <= 1 && sigmoid(1000) > 0.99);
  assert.ok(sigmoid(-1000) >= 0 && sigmoid(-1000) < 0.01);
});

test("american to decimal round-trips", () => {
  for (const american of [-250, -110, 110, 250]) {
    const d = americanToDecimal(american);
    assert.equal(decimalToAmerican(d), american);
  }
});

test("devig normalises to 1", () => {
  const { pA, pB } = devigTwoWay(0.55, 0.5);
  assert.ok(Math.abs(pA + pB - 1) < 1e-9);
});

test("expectedValue positive when model beats market", () => {
  const ev = expectedValueUnits(0.6, 2.0);
  assert.ok(ev > 0);
});

test("kelly returns 0 when no edge", () => {
  assert.equal(kellyFraction(0.5, 2.0), 0);
});

test("predict returns valid probability", () => {
  const features = {
    formGap: 0.1,
    offDefGap: 0.05,
    restGap: 0.3,
    travelGap: 0,
    homeAdvantage: 0.03,
    homeInjuryImpact: 0.1,
    awayInjuryImpact: 0.3,
    injuryGap: 0.2,
    newsSentimentGap: 0.1,
    newsVolatility: 0.2,
    lineSteam: 0.4,
    reverseLineMovement: 1,
    lineMoveMagnitude: 0.2,
  };
  const out = predict(features, DEFAULT_MONEYLINE_COEFFICIENTS);
  assert.ok(out.probability > 0 && out.probability < 1);
  assert.ok(out.contributions.length === Object.keys(features).length);
  // Contributions are sorted by absolute magnitude. Given the fixture, the top
  // two should be awayInjuryImpact (0.3 * 1.2 = 0.36) and homeAdvantage (0.03 * 8 = 0.24).
  const topFeatures = out.contributions.slice(0, 2).map((c) => c.feature);
  assert.ok(topFeatures.includes("awayInjuryImpact"));
  assert.ok(topFeatures.includes("homeAdvantage"));
});

test("injury impact grows with more players but diminishes", () => {
  const players = new Set(["p1", "p2"]);
  const single = injuryImpactForTeam(
    [{ id: "i1", playerId: "p1", status: "out", reportedAt: "", severity: 1 }],
    players,
  );
  const double = injuryImpactForTeam(
    [
      { id: "i1", playerId: "p1", status: "out", reportedAt: "", severity: 1 },
      { id: "i2", playerId: "p2", status: "out", reportedAt: "", severity: 1 },
    ],
    players,
  );
  assert.ok(double > single);
  assert.ok(double < 1);
});

test("stake band respects risk tolerance and maxPerBet", () => {
  const conservative = recommendStake({
    predictedProbability: 0.6,
    decimalOdds: 2.0,
    confidence: 0.8,
    riskTolerance: "conservative",
    maxPerBetUnits: 5,
  });
  const aggressive = recommendStake({
    predictedProbability: 0.6,
    decimalOdds: 2.0,
    confidence: 0.8,
    riskTolerance: "aggressive",
    maxPerBetUnits: 5,
  });
  assert.ok(aggressive.maxUnits >= conservative.maxUnits);
  assert.ok(conservative.maxUnits <= 5);
});

test("rank score penalises risk and volatility", () => {
  const base = {
    id: "",
    modelVersion: "",
    marketId: "",
    side: "home" as const,
    predictedProbability: 0.6,
    marketImpliedProbability: 0.5,
    edge: 0.1,
    expectedValue: 0.2,
    confidence: 0.7,
    risk: 0.2,
    newsStability: 0.8,
    lineVolatility: 0.2,
    recommendedUnitsMin: 1,
    recommendedUnitsMax: 2,
    contributingFactors: [],
    generatedAt: "",
    dataRefreshedAt: "",
  };
  const low = rankScore(base);
  const highRisk = rankScore({ ...base, risk: 0.9, lineVolatility: 0.9 });
  assert.ok(low > highRisk);
});
