import { notFound } from "next/navigation";
import type { Event, Market, Prediction, Recommendation, Bookmaker, Team } from "@dbp/shared";
import { fetchNews, fetchRecommendation } from "@/lib/api";
import { pct, signedPct, american } from "@/lib/format";
import { FactorBar } from "@/components/FactorBar";
import { NewsCard } from "@/components/NewsCard";

export const dynamic = "force-dynamic";

interface RecommendationPayload {
  recommendation: Recommendation;
  prediction: Prediction;
  event: Event;
  market: Market;
  bookmaker: Bookmaker;
  home?: Team;
  away?: Team;
}

export default async function PickDetail({ params }: { params: { id: string } }) {
  let data: RecommendationPayload;
  try {
    data = (await fetchRecommendation(params.id)) as RecommendationPayload;
  } catch {
    notFound();
  }
  const { recommendation, prediction, event, market, bookmaker } = data!;
  const expl = recommendation.explanation;
  const news = await fetchNews({ eventId: event.id, limit: 5 }).catch(() => ({ news: [] }));

  return (
    <div className="space-y-5 pb-32">
      <section className="card p-4">
        <div className="flex items-center justify-between text-[11px] muted">
          <span className="uppercase tracking-widest">{market.type}</span>
          <span>{new Date(event.startsAt).toLocaleString()}</span>
        </div>
        <h1 className="text-2xl font-bold mt-1">{expl.summary}</h1>
        <div className="pill-row mt-3">
          <span className="chip">Model {pct(prediction.predictedProbability)}</span>
          <span className="chip">Market {pct(prediction.marketImpliedProbability)}</span>
          <span className="chip chip-pos">Edge {signedPct(prediction.edge)}</span>
          <span className="chip">Confidence {pct(prediction.confidence, 0)}</span>
          <span className="chip chip-warn">Risk {pct(prediction.risk, 0)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatBlock title="Best price" value={american(data.recommendation ? 0 : 0)} />
          <StatBlock title="Bookmaker" value={bookmaker.displayName} />
          <StatBlock title="EV / unit" value={prediction.expectedValue.toFixed(2)} positive={prediction.expectedValue > 0} />
          <StatBlock
            title="Suggested stake"
            value={`${prediction.recommendedUnitsMin.toFixed(2)}–${prediction.recommendedUnitsMax.toFixed(2)} u`}
          />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold">Why this pick</h2>
        <p className="secondary text-sm mt-1">
          The top factors pushing the model toward this side. Bars are relative to the strongest contributor.
        </p>
        <div className="mt-3 space-y-2">
          {expl.keyFactors.map((f) => (
            <FactorBar key={f.key} factor={f} />
          ))}
        </div>
      </section>

      {expl.injuryNotes.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold">Injuries &amp; availability</h2>
          <ul className="list-disc pl-5 mt-2 secondary text-sm space-y-1">
            {expl.injuryNotes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      {expl.lineMovementNote && (
        <section className="card p-4">
          <h2 className="font-semibold">Line movement</h2>
          <p className="secondary text-sm mt-1">{expl.lineMovementNote}</p>
        </section>
      )}

      {expl.historicalNote && (
        <section className="card p-4">
          <h2 className="font-semibold">Recent form</h2>
          <p className="secondary text-sm mt-1">{expl.historicalNote}</p>
        </section>
      )}

      {news.news.length > 0 && (
        <section>
          <h2 className="font-semibold mb-2">Relevant news</h2>
          <div className="space-y-3">
            {news.news.map((n) => <NewsCard key={n.id} item={n} />)}
          </div>
        </section>
      )}

      <section className="card p-4 border-[#3a2d17] bg-[#1d1a10]">
        <h2 className="font-semibold text-warn">⚠️ Risk warning</h2>
        <p className="text-sm secondary mt-1">{expl.riskWarning}</p>
        <p className="text-[10px] muted mt-2">
          Data refreshed {new Date(expl.dataRefreshedAt).toLocaleTimeString()}.
        </p>
      </section>

      <div className="fixed bottom-16 left-0 right-0 px-4 pt-2 pb-3 bg-[rgba(11,16,32,0.95)] border-t border-[#1c2540]">
        <div className="mx-auto max-w-md flex gap-2">
          <button
            type="button"
            className="flex-1 py-3 rounded-xl bg-brand-500 font-semibold text-sm"
          >
            Open in {bookmaker.displayName}
          </button>
          <button
            type="button"
            className="px-4 py-3 rounded-xl border border-[#1c2540] text-sm"
            aria-label="Save pick"
          >
            ⭐
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ title, value, positive }: { title: string; value: string; positive?: boolean }) {
  const colour = positive === undefined ? "" : positive ? "text-pos" : "text-neg";
  return (
    <div className="rounded-lg bg-[#0d1530] border border-[#1c2540] p-3">
      <div className="text-[10px] uppercase tracking-widest muted">{title}</div>
      <div className={`font-semibold ${colour}`}>{value}</div>
    </div>
  );
}
