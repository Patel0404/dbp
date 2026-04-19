import Link from "next/link";
import type { TopPick } from "@dbp/shared";
import { american, pct, signedPct } from "@/lib/format";

const CATEGORY_LABEL: Record<string, string> = {
  highest_win_probability: "High win %",
  best_value: "Best value",
  safest: "Safest",
  contrarian: "Contrarian",
  live: "Live",
  news_driven: "News-driven",
};

export function PickCard({ pick, rank }: { pick: TopPick; rank: number }) {
  const { recommendation, prediction, event, home, away, odds, bookmaker } = pick;
  const sideLabel = recommendation.side === "home" ? home.shortName : recommendation.side === "away" ? away.shortName : String(recommendation.side);
  const counterLabel = recommendation.side === "home" ? away.shortName : home.shortName;
  const edgeClass = prediction.edge > 0.05 ? "chip-pos" : prediction.edge > 0 ? "chip" : "chip-neg";
  const riskClass = prediction.risk < 0.3 ? "chip-pos" : prediction.risk < 0.6 ? "chip-warn" : "chip-neg";
  const startsIn = formatStartsIn(event.startsAt);
  return (
    <Link
      href={`/pick/${recommendation.id}`}
      className="card block p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between text-[11px] muted">
        <span>
          #{rank} · {CATEGORY_LABEL[recommendation.category] ?? recommendation.category}
        </span>
        <span>{startsIn}</span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-lg font-semibold">
          {sideLabel} <span className="muted text-sm">vs {counterLabel}</span>
        </div>
        <div className="text-lg font-semibold tabular-nums">{american(odds.americanOdds)}</div>
      </div>
      <div className="muted text-[11px] mt-1">{bookmaker.displayName} · moneyline</div>

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <Stat label="Win prob" value={pct(prediction.predictedProbability, 1)} />
        <Stat label="Edge" value={signedPct(prediction.edge, 1)} positive={prediction.edge > 0} />
        <Stat label="EV / unit" value={`${prediction.expectedValue >= 0 ? "+" : ""}${prediction.expectedValue.toFixed(2)}`} positive={prediction.expectedValue > 0} />
      </div>

      <div className="pill-row mt-3">
        <span className="chip">Confidence {pct(prediction.confidence, 0)}</span>
        <span className={edgeClass}>Edge {signedPct(prediction.edge, 1)}</span>
        <span className={riskClass}>Risk {pct(prediction.risk, 0)}</span>
      </div>

      <p className="secondary text-[13px] mt-3 line-clamp-2">{recommendation.explanation.summary}</p>
    </Link>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const colour = positive === undefined ? "" : positive ? "text-pos" : "text-neg";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider muted">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${colour}`}>{value}</div>
    </div>
  );
}

function formatStartsIn(iso: string): string {
  const diffMin = Math.round((Date.parse(iso) - Date.now()) / 60_000);
  if (diffMin < 0) return "live / past";
  if (diffMin < 60) return `in ${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  if (h < 24) return `in ${h}h ${m}m`;
  const d = Math.floor(h / 24);
  return `in ${d}d ${h % 24}h`;
}
