# DBP — Sports Betting Advisory Platform

Mobile-first sports betting recommendation platform. Ranks bets by estimated
probability of winning, expected value, and risk, and **explains** every
recommendation in plain English. Advisory mode only by default — real-money
wagering is gated behind jurisdiction, KYC, and operator configuration.

This repository is the **MVP / Phase 1** implementation described in the
product spec (sections 1–29). It is runnable end-to-end against seeded data
with no vendor credentials required.

> ⚠️ Model probabilities are **estimates, not guarantees**. Gambling carries
> risk. If you or someone you know has a problem, help is available at
> [1-800-GAMBLER](tel:18004262537) / [BeGambleAware](https://www.begambleaware.org/).

---

## What's in the box

```
dbp/
├── apps/
│   ├── api/         Fastify + TypeScript API, OpenAPI at /docs
│   └── web/         Next.js 14 mobile-first web app
├── packages/
│   ├── shared/      Domain types, odds/compliance helpers
│   ├── scoring/     Transparent scoring + ranking engine (unit-tested)
│   └── adapters/    Odds / news / stats / execution / geo adapter pattern
├── db/
│   └── schema.sql   Postgres schema (spec §11) — target for the in-memory store
├── docker-compose.yml
└── .github/workflows/ci.yml
```

### Phase coverage

- **Phase 1 (this MVP)**: advisory mode, recommendations, transparent
  explanations, mobile UI, seeded demo data, adapter pattern, compliance
  guardrails, docker compose.
- **Phase 2 (not built, scaffolding in place)**: live models, bankroll
  management dashboards, admin tuning console, bookmaker execution
  integrations, SQL-backed store (schema is shipped).
- **Phase 3 (not built)**: automated execution where legally available,
  parlays, native shells.

---

## Getting started

```bash
npm install
npm run dev
```

- API → http://localhost:4000
- OpenAPI docs → http://localhost:4000/docs
- Web → http://localhost:3000

Alternatively:

```bash
docker compose up --build
```

The API boots with an in-memory store seeded from
[`apps/api/src/seed/fixtures.ts`](apps/api/src/seed/fixtures.ts) — NBA, EPL,
and a pair of injury/news stories that materially move the picks. No vendor
credentials are required for the demo.

### Tests

```bash
npm test
```

This runs:
- `@dbp/scoring` unit tests (sigmoid, devig, Kelly, feature engineering, stakes)
- `@dbp/api` integration tests (top picks, compliance gating, backtest runner)

---

## How the recommendation engine works

The scoring pipeline is intentionally transparent: coefficients map 1:1 to the
user-facing "why" factors, and every probability/edge/risk number on screen is
produced by code you can read.

1. **Feature engineering** (`packages/scoring/src/features.ts`)
   Combines fundamentals (form, rest, travel, matchup efficiency), market
   signals (line movement, steam, RLM), injury impact (status-weighted +
   diminishing returns), and news sentiment (credibility-weighted).
2. **Model** (`packages/scoring/src/model.ts`)
   Logistic regression over the feature vector with named weights. Returns a
   raw probability *and* per-feature contributions that the explainability
   layer renders as bars.
3. **Devig + EV** (`packages/shared/src/odds.ts`)
   Normalises the two-sided market to remove overround, compares model
   probability against the true market probability, computes expected value
   and Kelly fraction.
4. **Stake band** (`packages/scoring/src/stakes.ts`)
   Fractional-Kelly range scaled by user risk tolerance and confidence. Never
   forces a stake — the UI shows a min/max band.
5. **Ranking** (`packages/scoring/src/ranking.ts`)
   `rank_score = w1·p + w2·edge + w3·confidence − w4·risk − w5·volatility`.
   Weights are tunable at runtime via `POST /v1/admin/scoring-weights`.
6. **Explainability** (`packages/scoring/src/explain.ts`)
   Turns the top model contributions into plain-language cards on the
   recommendation detail screen.

### Example explanation

> **Model favours Boston Celtics at 63.2% vs market implied 55.8%** —
> home-field edge favours the pick (+3.0%).
>
> - Rest advantage: 2.0 days
> - Injury differential: Jimmy Butler out, LeBron James questionable
> - Line moved -20 pts from open with reverse line movement
> - BOS 8-2 last 10, LAL 5-5
>
> ⚠️ Model probabilities are estimates, not guarantees. Never wager more than you can afford to lose.

---

## Compliance & product modes

The `PRODUCT_MODE` env var gates execution features at the API boundary
(`packages/adapters/src/execution/index.ts::gateExecution`):

| Mode                   | Default? | Behaviour |
|------------------------|----------|-----------|
| `advisory`             | ✅ yes   | Recommendations only. Execution endpoints exist but always reject. |
| `assisted_execution`   | opt-in  | Requires verified user + compliant jurisdiction + wired bookmaker adapter. |
| `automated_execution`  | opt-in  | Above + per-user + global kill switches. Not implemented in MVP. |

Even with execution enabled, every wager request must pass:

- Jurisdiction allows real-money wagering (`jurisdiction_rules`)
- Age verified
- Identity verified
- Not self-excluded, not in cool-off
- Global kill switch not tripped

The `ComplianceBanner` React component renders on every page so the mode is
never hidden from the user.

---

## API surface (selected)

See `/docs` (Swagger UI) for the full OpenAPI spec.

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/v1/top-picks` | Ranked picks with filters (sport, category, confidence, edge) |
| GET    | `/v1/recommendations/:id` | One recommendation with prediction, event, market, bookmaker |
| GET    | `/v1/events` / `/v1/events/:id` | Events + markets + odds |
| GET    | `/v1/news` | News with impact/sentiment tags |
| GET    | `/v1/performance` | Hit rate, ROI, CLV, per-day & per-sport breakdowns |
| GET    | `/v1/compliance/jurisdictions` | Jurisdiction rules list |
| GET    | `/v1/compliance/mode` | Current product mode + disclaimer |
| POST   | `/v1/execution/preview` | Pre-place validation (gated) |
| POST   | `/v1/execution/place` | Place a bet (gated; disabled in advisory) |
| GET    | `/v1/admin/data-health` | Provider freshness & row counts |
| POST   | `/v1/admin/scoring-weights` | Live-tune ranking weights |

Admin routes require `X-Admin-Token` when `ADMIN_TOKEN` is set; in production,
the app refuses to expose them without one.

---

## Adapter pattern

`packages/adapters` defines the interfaces used by ingestion and execution.
Each real vendor is a swappable implementation:

- `OddsProvider` — `MockOddsProvider` (default); `TheOddsApiProvider` stub for
  [the-odds-api.com](https://the-odds-api.com) wiring.
- `StatsProvider` — mock; SportsDataIO/other feeds plug in here.
- `NewsProvider` — mock; NLP pipeline slot is `packages/adapters/src/news/index.ts`.
- `ExecutionProvider` — `DisabledExecutionProvider` (default),
  `OpenInSportsbookProvider` (fallback deep-link), Betfair-style exchange
  implementations plug in here.
- `GeoProvider` — `HeaderGeoProvider` stub; real deployments wire an
  authoritative IP + device GPS + VPN-detection vendor.

---

## Mobile UX

The web app is mobile-first and constrained to `max-w-md` on larger viewports
so the layout stays one-handed. Highlights:

- Sticky bottom navigation (Picks / News / Portfolio / Performance / Account)
- Persistent compliance banner
- Skeleton loaders and `no-store` fetches for fresh data
- Card-based pick surface with edge / confidence / risk chips
- Pick detail shows contribution bars, injury notes, line movement, relevant news
- PWA manifest shipped at `/manifest.json`

---

## Backtesting

`apps/api/src/backtest/runner.ts` exposes a small replay engine that computes
hit rate, ROI (flat-unit), Brier score, log loss, and 10-bucket calibration.
These are the knobs the model deployment gate (spec §13) checks.

```ts
import { runBacktest } from "./backtest/runner.js";
const report = runBacktest(rows);
// { n, hitRate, roiFlatUnit, brier, logLoss, calibrationBuckets }
```

---

## What's intentionally out of scope for this MVP

The spec is comprehensive; this MVP ships Phase 1. These items are **not**
implemented but have clearly marked extension points:

- Postgres-backed repositories (schema shipped at `db/schema.sql`; swap
  `apps/api/src/store/in_memory.ts` for a SQL implementation)
- Real vendor ingestion workers (`packages/adapters` holds the interfaces)
- Real KYC/AML/geolocation integration (`GeoProvider`)
- Bet execution against a licensed sportsbook or exchange
- Full admin console UI (admin API exists; console is Phase 2)
- Push/SMS notification channels
- Model training pipeline (coefficients are hand-set; the shape matches a
  learned logistic regression so swap-in is mechanical)

---

## Critical warnings

Repeating from spec §29 because they matter:

1. Never market probabilities as guarantees.
2. Never allow execution without explicit opt-in + jurisdiction approval.
3. Never assume sportsbooks expose public wager APIs.
4. Never distribute real-money features via app stores without proper licensing.
5. Never skip geolocation, KYC, and self-exclusion requirements.
6. Never deploy models without calibration and drift monitoring.

---

## License

Internal prototype. Not for redistribution.
