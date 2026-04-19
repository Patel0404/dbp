// Transparent logistic regression with hand-tuned coefficients. This is
// deliberately simple — the product spec mandates explainability over raw
// accuracy, and the coefficients map 1:1 to user-facing "why" factors. A real
// deployment would fit these via training with calibration, but the shape is
// identical.

import type { FeatureVector } from "./features.js";

export interface ModelCoefficients {
  intercept: number;
  weights: Record<keyof FeatureVector, number>;
}

export interface ModelOutput {
  probability: number; // P(home covers/wins)
  logit: number;
  contributions: Array<{ feature: keyof FeatureVector; contribution: number; value: number }>;
}

// Coefficients are signed so positive = helps the home side. For "away side" or
// over/under picks the API flips the sign before interpreting.
export const DEFAULT_MONEYLINE_COEFFICIENTS: ModelCoefficients = {
  intercept: 0,
  weights: {
    formGap: 0.9,
    offDefGap: 0.7,
    restGap: 0.35,
    travelGap: 0.4,
    homeAdvantage: 8.0,
    homeInjuryImpact: -1.2,
    awayInjuryImpact: 1.2,
    injuryGap: 0.6,
    newsSentimentGap: 0.35,
    newsVolatility: -0.1,
    lineSteam: 0.25,
    reverseLineMovement: 0.2,
    lineMoveMagnitude: 0.15,
  },
};

export function sigmoid(x: number): number {
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  }
  const z = Math.exp(x);
  return z / (1 + z);
}

export function predict(features: FeatureVector, coef: ModelCoefficients = DEFAULT_MONEYLINE_COEFFICIENTS): ModelOutput {
  let logit = coef.intercept;
  const contributions: ModelOutput["contributions"] = [];
  for (const [key, weight] of Object.entries(coef.weights) as Array<[keyof FeatureVector, number]>) {
    const value = features[key];
    const contribution = value * weight;
    logit += contribution;
    contributions.push({ feature: key, value, contribution });
  }
  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { probability: sigmoid(logit), logit, contributions };
}

// Platt-style calibration shim. In production this is fit on a holdout set.
// We expose it explicitly so calibration deploy gates (spec §13) are enforceable.
export interface Calibrator {
  calibrate(rawProb: number): number;
}

export class IdentityCalibrator implements Calibrator {
  calibrate(p: number): number {
    return p;
  }
}

export class PlattCalibrator implements Calibrator {
  constructor(private readonly a: number, private readonly b: number) {}
  calibrate(p: number): number {
    const logit = Math.log(p / (1 - p));
    return sigmoid(this.a * logit + this.b);
  }
}
