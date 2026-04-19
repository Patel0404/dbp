import { clamp, kellyFraction } from "@dbp/shared";

export interface StakeBand {
  minUnits: number;
  maxUnits: number;
  fractionalKelly: number;
}

// Maps predicted probability + odds + user risk tolerance into a *band* of
// stake sizes. We never force a stake — the UI presents a range and the user
// chooses. This matches the "recommended stake bands rather than forced stake"
// requirement in spec §7.11.
export function recommendStake(params: {
  predictedProbability: number;
  decimalOdds: number;
  confidence: number; // 0..1
  riskTolerance: "conservative" | "balanced" | "aggressive";
  maxPerBetUnits: number;
}): StakeBand {
  const rawKelly = kellyFraction(params.predictedProbability, params.decimalOdds);
  const fractionByTolerance = {
    conservative: 0.15,
    balanced: 0.25,
    aggressive: 0.5,
  }[params.riskTolerance];

  const scaled = rawKelly * fractionByTolerance * clamp(params.confidence, 0, 1);
  const center = clamp(scaled * 10, 0, params.maxPerBetUnits); // Kelly fraction -> units on a 10u scale
  const width = Math.max(0.25, center * 0.4);
  return {
    minUnits: Number(Math.max(0, center - width).toFixed(2)),
    maxUnits: Number(Math.min(params.maxPerBetUnits, center + width).toFixed(2)),
    fractionalKelly: Number((rawKelly * fractionByTolerance).toFixed(4)),
  };
}
