// Utilities for converting between odds formats. Small enough to inline; kept
// here so every service uses the same math.

export function americanToDecimal(american: number): number {
  if (!Number.isFinite(american) || american === 0) {
    throw new Error(`invalid american odds: ${american}`);
  }
  return american > 0 ? 1 + american / 100 : 1 + 100 / Math.abs(american);
}

export function decimalToAmerican(decimal: number): number {
  if (!Number.isFinite(decimal) || decimal <= 1) {
    throw new Error(`invalid decimal odds: ${decimal}`);
  }
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export function americanToImpliedProbability(american: number): number {
  return 1 / americanToDecimal(american);
}

export function decimalToImpliedProbability(decimal: number): number {
  return 1 / decimal;
}

// Removes the vig from a two-sided market by normalising to sum=1.
// Used when we want a "true" market probability without overround.
export function devigTwoWay(pA: number, pB: number): { pA: number; pB: number } {
  const sum = pA + pB;
  if (sum <= 0) throw new Error("cannot devig non-positive probabilities");
  return { pA: pA / sum, pB: pB / sum };
}

export function expectedValueUnits(predictedProb: number, decimalOdds: number): number {
  // Stake 1 unit: EV = p * (odds-1) - (1-p)
  return predictedProb * (decimalOdds - 1) - (1 - predictedProb);
}

export function kellyFraction(predictedProb: number, decimalOdds: number): number {
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  const f = (predictedProb * (b + 1) - 1) / b;
  return Math.max(0, f);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
