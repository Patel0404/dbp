-- Canonical PostgreSQL schema for the DBP platform. The MVP API ships with
-- an in-memory repository so the demo runs without a database; this file is
-- the production target that those repositories can be migrated to.
--
-- Matches the data model described in the spec, sections 10 and 11.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  external_id TEXT
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  external_id TEXT
);

CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  external_id TEXT
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  starts_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  venue TEXT,
  weather JSONB
);
CREATE INDEX events_starts_idx ON events(starts_at);
CREATE INDEX events_status_idx ON events(status);

CREATE TABLE bookmakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  regions TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  line NUMERIC,
  player_id UUID REFERENCES players(id),
  prop_key TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX markets_event_idx ON markets(event_id);

CREATE TABLE odds_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id),
  side TEXT NOT NULL,
  american_odds INT NOT NULL,
  decimal_odds NUMERIC NOT NULL,
  implied_probability NUMERIC NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX odds_market_captured_idx ON odds_snapshots(market_id, captured_at DESC);

CREATE TABLE odds_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id),
  side TEXT NOT NULL,
  open_american INT NOT NULL,
  current_american INT NOT NULL,
  closing_american INT,
  delta_american INT NOT NULL,
  steam_score NUMERIC NOT NULL,
  reverse_line_movement BOOLEAN NOT NULL
);

CREATE TABLE injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  designation TEXT,
  reported_at TIMESTAMPTZ NOT NULL,
  severity NUMERIC NOT NULL
);

CREATE TABLE lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id),
  player_ids UUID[] NOT NULL
);

CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline TEXT NOT NULL,
  summary TEXT,
  source TEXT NOT NULL,
  source_credibility NUMERIC NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  sentiment TEXT,
  impact TEXT,
  urgency NUMERIC,
  relevance NUMERIC,
  confidence NUMERIC,
  external_id TEXT
);
CREATE INDEX news_published_idx ON news_articles(published_at DESC);

CREATE TABLE news_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  entity_id UUID NOT NULL,
  label TEXT NOT NULL
);

CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT UNIQUE NOT NULL,
  sport_key TEXT NOT NULL,
  market_type TEXT NOT NULL,
  coefficients JSONB NOT NULL,
  calibrator JSONB,
  deployed_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ,
  drift_threshold NUMERIC,
  calibration_threshold NUMERIC
);

CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version TEXT NOT NULL,
  market_id UUID NOT NULL REFERENCES markets(id),
  side TEXT NOT NULL,
  predicted_probability NUMERIC NOT NULL,
  market_implied_probability NUMERIC NOT NULL,
  edge NUMERIC NOT NULL,
  expected_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  risk NUMERIC NOT NULL,
  news_stability NUMERIC NOT NULL,
  line_volatility NUMERIC NOT NULL,
  recommended_units_min NUMERIC NOT NULL,
  recommended_units_max NUMERIC NOT NULL,
  contributing_factors JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_refreshed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id),
  side TEXT NOT NULL,
  rank_score NUMERIC NOT NULL,
  category TEXT NOT NULL,
  explanation JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  invalidated_at TIMESTAMPTZ,
  invalidation_reason TEXT
);
CREATE INDEX recommendations_rank_idx ON recommendations(rank_score DESC);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  mfa_secret TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jurisdiction_code TEXT,
  age_verified BOOLEAN NOT NULL DEFAULT FALSE,
  identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
  self_excluded_until TIMESTAMPTZ,
  deposit_limit NUMERIC,
  loss_limit NUMERIC,
  wager_limit NUMERIC,
  session_reminder_minutes INT,
  cool_off_until TIMESTAMPTZ
);

CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  favorite_sports TEXT[] NOT NULL DEFAULT '{}',
  favorite_team_ids UUID[] NOT NULL DEFAULT '{}',
  favorite_bookmaker_ids UUID[] NOT NULL DEFAULT '{}',
  risk_tolerance TEXT NOT NULL DEFAULT 'balanced',
  min_confidence NUMERIC NOT NULL DEFAULT 0.5,
  min_edge NUMERIC NOT NULL DEFAULT 0.0,
  max_per_bet_units NUMERIC NOT NULL DEFAULT 2
);

CREATE TABLE bankrolls (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'USD',
  total NUMERIC NOT NULL DEFAULT 0,
  unit_size NUMERIC NOT NULL DEFAULT 10,
  daily_cap NUMERIC NOT NULL DEFAULT 0,
  weekly_cap NUMERIC NOT NULL DEFAULT 0,
  monthly_cap NUMERIC NOT NULL DEFAULT 0,
  stop_loss_pct NUMERIC NOT NULL DEFAULT 0,
  kelly_fraction NUMERIC NOT NULL DEFAULT 0.25
);

CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES recommendations(id),
  market_id UUID NOT NULL REFERENCES markets(id),
  bookmaker_id UUID NOT NULL REFERENCES bookmakers(id),
  side TEXT NOT NULL,
  stake_units NUMERIC NOT NULL,
  american_odds INT NOT NULL,
  decimal_odds NUMERIC NOT NULL,
  placed_at TIMESTAMPTZ,
  settled_at TIMESTAMPTZ,
  outcome TEXT,
  profit_units NUMERIC
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE jurisdiction_rules (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  allows_advisory BOOLEAN NOT NULL,
  allows_real_money BOOLEAN NOT NULL,
  min_age INT NOT NULL,
  disclaimers TEXT[] NOT NULL DEFAULT '{}',
  responsible_gambling_resources JSONB NOT NULL DEFAULT '[]'
);

COMMIT;
