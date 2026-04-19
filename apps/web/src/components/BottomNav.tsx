"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Picks", icon: "🎯" },
  { href: "/news", label: "News", icon: "📰" },
  { href: "/portfolio", label: "Portfolio", icon: "📊" },
  { href: "/performance", label: "Performance", icon: "📈" },
  { href: "/account", label: "Account", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[rgba(11,16,32,0.92)] backdrop-blur border-t border-[#1c2540]">
      <div className="mx-auto max-w-md grid grid-cols-5">
        {tabs.map((t) => {
          const active = pathname === t.href || (t.href !== "/" && pathname.startsWith(t.href));
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center py-2 text-[11px] ${active ? "text-white" : "muted"}`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="mt-0.5">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
