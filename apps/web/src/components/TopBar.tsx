import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-[rgba(11,16,32,0.9)] backdrop-blur border-b border-[#1c2540] px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-sm">
          DBP
        </div>
        <div>
          <div className="text-sm font-semibold">Smarter Picks</div>
          <div className="text-[10px] muted uppercase tracking-widest">Advisory Mode</div>
        </div>
      </Link>
      <Link
        href="/account"
        aria-label="Account"
        className="w-9 h-9 rounded-full border border-[#1c2540] flex items-center justify-center text-sm"
      >
        👤
      </Link>
    </header>
  );
}
