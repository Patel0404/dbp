import Link from "next/link";

const categories: Array<{ key?: string; label: string }> = [
  { label: "All" },
  { key: "highest_win_probability", label: "High win %" },
  { key: "best_value", label: "Best value" },
  { key: "safest", label: "Safest" },
  { key: "news_driven", label: "News-driven" },
  { key: "contrarian", label: "Contrarian" },
];

export function CategoryFilter({ active, sport }: { active?: string; sport?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1">
      {categories.map((c) => {
        const isActive = (c.key ?? "") === (active ?? "");
        const params = new URLSearchParams();
        if (c.key) params.set("category", c.key);
        if (sport) params.set("sport", sport);
        const href = params.toString() ? `/?${params.toString()}` : "/";
        return (
          <Link
            key={c.label}
            href={href}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs border ${
              isActive
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-[#1c2540] secondary"
            }`}
          >
            {c.label}
          </Link>
        );
      })}
    </div>
  );
}
