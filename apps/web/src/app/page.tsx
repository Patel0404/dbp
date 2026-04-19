import { Suspense } from "react";
import { fetchTopPicks } from "@/lib/api";
import { PickCard } from "@/components/PickCard";
import { CategoryFilter } from "@/components/CategoryFilter";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { category?: string; sport?: string };
}) {
  return (
    <div className="space-y-4 pt-2">
      <section>
        <h1 className="text-xl font-bold">Today&apos;s top picks</h1>
        <p className="muted text-sm">Ranked by model confidence, edge, and risk.</p>
      </section>
      <CategoryFilter active={searchParams.category} sport={searchParams.sport} />
      <Suspense fallback={<PickSkeletons />}>
        <PicksList category={searchParams.category} sport={searchParams.sport} />
      </Suspense>
    </div>
  );
}

async function PicksList({ category, sport }: { category?: string; sport?: string }) {
  try {
    const data = await fetchTopPicks({ limit: 20, category, sport });
    if (data.picks.length === 0) {
      return (
        <div className="card p-4 text-center">
          <p className="secondary">No picks match those filters right now.</p>
          <p className="muted text-[11px] mt-1">Try widening the filter or checking back closer to tip-off.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {data.picks.map((pick, i) => (
          <PickCard key={pick.recommendation.id} pick={pick} rank={i + 1} />
        ))}
        <p className="text-[10px] muted text-center pt-2">
          Refreshed {new Date(data.refreshedAt).toLocaleTimeString()}
        </p>
      </div>
    );
  } catch (err) {
    return (
      <div className="card p-4">
        <p className="text-neg text-sm">Could not load picks.</p>
        <p className="muted text-[11px] mt-1">Is the API running on :4000?</p>
      </div>
    );
  }
}

function PickSkeletons() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-5 w-3/4" />
          <div className="grid grid-cols-3 gap-2">
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
            <div className="skeleton h-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
