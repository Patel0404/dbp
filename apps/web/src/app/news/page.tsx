import { fetchNews } from "@/lib/api";
import { NewsCard } from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const data = await fetchNews({ limit: 50 }).catch(() => ({ news: [] }));
  return (
    <div className="space-y-4 pt-2">
      <section>
        <h1 className="text-xl font-bold">News</h1>
        <p className="muted text-sm">Tagged by relevance, impact, and source credibility.</p>
      </section>
      <div className="space-y-3">
        {data.news.length === 0 && (
          <div className="card p-4 secondary text-sm">No news in the feed right now.</div>
        )}
        {data.news.map((n) => <NewsCard key={n.id} item={n} />)}
      </div>
    </div>
  );
}
