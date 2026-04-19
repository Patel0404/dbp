import type { ExplanationFactor } from "@dbp/shared";

export function FactorBar({ factor }: { factor: ExplanationFactor }) {
  const tone =
    factor.direction === "for" ? "bg-pos" : factor.direction === "against" ? "bg-neg" : "bg-[#3b4a74]";
  const width = `${Math.max(6, Math.round(factor.weight * 100))}%`;
  return (
    <div>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium">{factor.label}</span>
        <span className="muted tabular-nums">{factor.valueText}</span>
      </div>
      <div className="h-1.5 mt-1 bg-[#10172e] rounded-full overflow-hidden">
        <div className={`${tone} h-full`} style={{ width }} />
      </div>
    </div>
  );
}
