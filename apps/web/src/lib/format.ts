export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const signedPct = (n: number, digits = 1) => `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
export const american = (n: number) => (n > 0 ? `+${n}` : `${n}`);
export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
