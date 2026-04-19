import type { NewsItem } from "@dbp/shared";

export function NewsCard({ item }: { item: NewsItem }) {
  const toneClass =
    item.impact === "positive" ? "chip-pos" : item.impact === "negative" ? "chip-neg" : "chip-warn";
  return (
    <article className="card p-3">
      <div className="flex items-center justify-between text-[11px] muted">
        <span>{item.source}</span>
        <span>{timeAgo(item.publishedAt)}</span>
      </div>
      <h3 className="font-semibold text-[14px] mt-1">{item.headline}</h3>
      <p className="secondary text-[13px] mt-1 line-clamp-3">{item.summary}</p>
      <div className="pill-row mt-2">
        <span className={`chip ${toneClass}`}>{item.impact}</span>
        <span className="chip">Relevance {Math.round(item.relevance * 100)}%</span>
        <span className="chip">Confidence {Math.round(item.confidence * 100)}%</span>
      </div>
    </article>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  const mins = Math.round(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
