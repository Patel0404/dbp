import Link from "next/link";
import { fetchIntegrationCatalog, fetchIntegrations } from "@/lib/api";
import { IntegrationForm } from "./IntegrationForm";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const [catalogRes, integrationsRes] = await Promise.all([
    fetchIntegrationCatalog().catch(() => ({ catalog: [] as Array<{ key: string; displayName: string; description: string; supportsRealMoney: boolean; setupUrl?: string; fields: Array<{ name: string; label: string; type: "text" | "password" | "textarea"; placeholder?: string; required?: boolean; help?: string }> }> })),
    fetchIntegrations().catch(() => ({ integrations: [] })),
  ]);

  const byKey = new Map<string, NonNullable<(typeof integrationsRes.integrations)[number]>>();
  for (const r of integrationsRes.integrations) {
    if (r) byKey.set(r.key, r);
  }

  return (
    <div className="space-y-4 pt-2 pb-24">
      <Link href="/account" className="text-sm secondary">← Back to account</Link>
      <section>
        <h1 className="text-xl font-bold">Integrations</h1>
        <p className="muted text-sm mt-1">
          Connect a sportsbook, exchange, or odds feed. Credentials are stored server-side only and never returned after saving.
        </p>
      </section>

      <section className="card p-4 border-[#3a2d17] bg-[#1d1a10]">
        <h2 className="font-semibold text-warn text-sm">⚠️ What actually works</h2>
        <ul className="list-disc pl-5 mt-2 secondary text-[13px] space-y-1">
          <li><strong>Kalshi</strong> (US, event contracts) and <strong>Betfair</strong> (UK/EU) are the only real APIs for automated placement. Paste credentials below.</li>
          <li><strong>DraftKings / FanDuel</strong> — no public API. "Deep-link" option opens the book to the event page for manual placement.</li>
          <li>Automating against US consumer books via private APIs violates ToS and typically results in account closure + voided winnings.</li>
        </ul>
      </section>

      <div className="space-y-3">
        {catalogRes.catalog.map((entry) => (
          <IntegrationForm
            key={entry.key}
            entry={entry}
            record={byKey.get(entry.key) ?? null}
          />
        ))}
      </div>
    </div>
  );
}
