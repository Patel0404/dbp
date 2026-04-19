import Link from "next/link";

export default function AccountPage() {
  return (
    <div className="space-y-4 pt-2">
      <section>
        <h1 className="text-xl font-bold">Account</h1>
        <p className="muted text-sm">Settings, limits, and responsible gaming controls.</p>
      </section>

      <Link
        href="/account/integrations"
        className="card p-4 flex items-center justify-between active:scale-[0.99] transition-transform"
      >
        <div>
          <div className="font-semibold text-sm">Integrations</div>
          <div className="muted text-[12px]">Connect Kalshi, Betfair, sportsbooks &amp; odds feeds</div>
        </div>
        <span className="secondary">›</span>
      </Link>

      <SectionCard title="Responsible gaming">
        <ToggleRow label="Loss limit" value="Not set" />
        <ToggleRow label="Deposit limit" value="Not set" />
        <ToggleRow label="Session reminder" value="Off" />
        <ToggleRow label="Self-exclusion" value="Inactive" />
        <p className="muted text-[11px] mt-2">
          Help: <a className="underline" href="tel:18004262537">1-800-GAMBLER</a>
        </p>
      </SectionCard>

      <SectionCard title="Verification">
        <ToggleRow label="Age verification" value="Not verified" />
        <ToggleRow label="Identity verification" value="Not verified" />
        <ToggleRow label="Jurisdiction" value="Auto-detect (US-NJ)" />
      </SectionCard>

      <SectionCard title="Preferences">
        <ToggleRow label="Risk tolerance" value="Balanced" />
        <ToggleRow label="Min confidence" value="50%" />
        <ToggleRow label="Min edge" value="0%" />
        <ToggleRow label="Max per-bet units" value="2" />
      </SectionCard>

      <SectionCard title="Notifications">
        <ToggleRow label="New top picks" value="On" />
        <ToggleRow label="Rapid line movement" value="Off" />
        <ToggleRow label="News changes" value="On" />
        <ToggleRow label="Quiet hours" value="22:00–07:00" />
      </SectionCard>

      <p className="text-[11px] muted text-center pt-4">
        DBP is an advisory tool. Model probabilities are estimates, not guarantees.
      </p>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="font-semibold text-sm mb-2">{title}</h2>
      <div className="divide-y divide-[#1c2540] -mx-1">{children}</div>
    </section>
  );
}

function ToggleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-1 text-sm">
      <span>{label}</span>
      <span className="muted">{value}</span>
    </div>
  );
}
