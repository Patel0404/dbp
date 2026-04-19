export default function PortfolioPage() {
  return (
    <div className="space-y-4 pt-2">
      <section>
        <h1 className="text-xl font-bold">Portfolio</h1>
        <p className="muted text-sm">Your open and saved picks.</p>
      </section>

      <section className="card p-5 text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="font-medium">No open bets yet</p>
        <p className="muted text-[13px] mt-1">
          Save picks from the top-picks screen. Once real-money execution is enabled for your jurisdiction,
          placed wagers will appear here.
        </p>
      </section>

      <section className="card p-4">
        <h2 className="font-semibold text-sm">Bankroll</h2>
        <div className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
          <Row label="Bankroll" value="Not configured" />
          <Row label="Unit size" value="—" />
          <Row label="Daily cap" value="—" />
          <Row label="Stop-loss" value="—" />
        </div>
        <p className="muted text-[11px] mt-3">Configure in Account → Bankroll.</p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
