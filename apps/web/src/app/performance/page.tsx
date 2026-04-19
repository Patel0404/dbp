import { fetchPerformance } from "@/lib/api";
import { pct, signedPct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const data = await fetchPerformance().catch(() => null);
  if (!data) {
    return (
      <div className="card p-4 text-sm text-neg">Could not load performance.</div>
    );
  }
  return (
    <div className="space-y-4 pt-2">
      <section>
        <h1 className="text-xl font-bold">Performance</h1>
        <p className="muted text-sm">Model: {data.summary.modelVersion} · sample {data.summary.sampleSize}</p>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Tile label="Hit rate" value={pct(data.summary.hitRate)} positive={data.summary.hitRate >= 0.52} />
        <Tile label="ROI" value={signedPct(data.summary.roi)} positive={data.summary.roi >= 0} />
        <Tile label="Avg edge" value={signedPct(data.summary.avgEdge)} positive={data.summary.avgEdge >= 0} />
        <Tile label="Avg CLV" value={signedPct(data.summary.avgClosingLineValue)} positive={data.summary.avgClosingLineValue >= 0} />
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Last 14 days</h2>
        <Sparkline values={data.byDay.map((d) => d.roi)} />
        <div className="mt-3 text-[11px] secondary grid grid-cols-3 gap-2 tabular-nums">
          {data.byDay.slice(-5).map((d) => (
            <div key={d.date} className="flex items-center justify-between rounded-md bg-[#0d1530] border border-[#1c2540] px-2 py-1">
              <span className="muted">{d.date.slice(5)}</span>
              <span className={d.roi >= 0 ? "text-pos" : "text-neg"}>{signedPct(d.roi)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">By sport</h2>
        <div className="mt-2 space-y-2">
          {data.bySport.map((s) => (
            <div key={s.sport} className="flex items-center justify-between text-sm">
              <span className="uppercase text-[11px] tracking-widest muted">{s.sport}</span>
              <span className="tabular-nums">
                <span className="secondary">{pct(s.hitRate)}</span>{" "}
                <span className={s.roi >= 0 ? "text-pos" : "text-neg"}>{signedPct(s.roi)}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] muted">{data.warning}</p>
    </div>
  );
}

function Tile({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  const colour = positive === undefined ? "" : positive ? "text-pos" : "text-neg";
  return (
    <div className="card p-3">
      <div className="text-[10px] uppercase tracking-widest muted">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${colour}`}>{value}</div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16 mt-2">
      <polyline points={points} fill="none" stroke="#3b5bff" strokeWidth="2" />
    </svg>
  );
}
