-- Initial Schema Baseline
-- Version: 2.0 (aligned with PRD v3)

-- ── EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── ENUMS ────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE trust_tier AS ENUM ('registered', 'verified', 'active', 'accredited');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE profile_status AS ENUM ('unclaimed', 'claimed', 'self_registered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE data_source AS ENUM ('cac', 'ocha_3w', 'nnngo_public', 'self_registered', 'admin_import');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM ('ngo', 'cbo', 'foundation', 'social_enterprise', 'ingo', 'network', 'faith_based', 'government_affiliated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ngo_status AS ENUM ('active', 'inactive', 'dormant', 'suspended', 'deregistered');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ── UPDATED_AT TRIGGER ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- ── 1. LGA_DATA ──────────────────────
CREATE TABLE IF NOT EXISTS lga_gap_scores (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    population INTEGER,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    need_index NUMERIC(3,2) DEFAULT 0.00 CHECK (need_index >= 0 AND need_index <= 1),
    primary_needs JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ocha_coverage  BOOLEAN DEFAULT false,
    ngo_count_total    SMALLINT DEFAULT 0,
    ngo_count_verified SMALLINT DEFAULT 0,
    gap_score          NUMERIC(5,4) GENERATED ALWAYS AS (
        GREATEST(0, LEAST(1, need_index - (ngo_count_verified * 0.05)))
    ) STORED
);

-- ── 2. SECTORS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sectors (
  id        SMALLINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  slug      TEXT NOT NULL UNIQUE,
  name      TEXT NOT NULL,
  parent_id SMALLINT REFERENCES sectors(id),
  icon      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO sectors (slug, name, icon) VALUES
  ('health',                  'Health',                    'HeartPulse'),
  ('education',               'Education',                 'GraduationCap'),
  ('wash',                    'WASH',                      'Droplets'),
  ('nutrition',               'Nutrition',                 'Apple'),
  ('gbv-protection',          'GBV & Protection',          'ShieldAlert'),
  ('livelihoods',             'Livelihoods',               'Sprout'),
  ('environment',             'Environment',               'Leaf'),
  ('governance',              'Governance & Accountability','Scale'),
  ('humanitarian-response',   'Humanitarian Response',     'HeartHandshake'),
  ('disability',              'Disability Inclusion',      'Accessibility'),
  ('youth-development',       'Youth Development',         'Users'),
  ('agriculture',             'Agriculture',               'Wheat'),
  ('peacebuilding',           'Peacebuilding',             'Handshake'),
  ('migration-displacement',  'Migration & Displacement',  'Navigation'),
  ('other',                   'Other',                     'MoreHorizontal')
ON CONFLICT (slug) DO NOTHING;

-- ── 3. ORGANISATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organisations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  legal_name    TEXT NOT NULL,
  trade_name    TEXT,
  acronym       TEXT,
  entity_type   entity_type NOT NULL DEFAULT 'ngo',
  cac_number    TEXT UNIQUE,
  cac_verified  BOOLEAN DEFAULT false,
  cac_verified_at TIMESTAMPTZ,
  year_founded  SMALLINT,
  trust_tier    trust_tier NOT NULL DEFAULT 'registered',
  trust_score   SMALLINT DEFAULT 0,
  profile_status profile_status NOT NULL DEFAULT 'self_registered',
  claimed_at    TIMESTAMPTZ,
  data_source   data_source NOT NULL DEFAULT 'self_registered',
  data_source_ref TEXT,
  removal_requested    BOOLEAN DEFAULT false,
  removal_requested_at TIMESTAMPTZ,
  removal_reason       TEXT,
  status        ngo_status NOT NULL DEFAULT 'active',
  is_ingo       BOOLEAN DEFAULT false,
  mission       TEXT,
  description   TEXT,
  website       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  lga_id        INTEGER REFERENCES lga_gap_scores(id),
  twitter_handle TEXT,
  linkedin_url   TEXT,
  staff_count_range   TEXT CHECK (staff_count_range IN ('1-5','6-10','11-50','51-200','200+')),
  annual_budget_range TEXT CHECK (annual_budget_range IN ('under-10m','10m-50m','50m-200m','200m+')),
  last_activity_at     TIMESTAMPTZ,
  last_declaration_at  TIMESTAMPTZ,
  next_declaration_due DATE,
  staleness_flag       BOOLEAN DEFAULT false,
  user_id       UUID, -- REFERENCES auth.users(id) - handled in Supabase
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS orgs_trust_tier_idx    ON organisations(trust_tier);
CREATE INDEX IF NOT EXISTS orgs_profile_status_idx ON organisations(profile_status);
CREATE INDEX IF NOT EXISTS orgs_lga_idx           ON organisations(lga_id);
CREATE INDEX IF NOT EXISTS orgs_status_idx        ON organisations(status);
CREATE INDEX IF NOT EXISTS orgs_search_idx ON organisations
  USING GIN(to_tsvector('english',
    coalesce(legal_name,'') || ' ' ||
    coalesce(trade_name,'') || ' ' ||
    coalesce(acronym,'') || ' ' ||
    coalesce(description,'')
  ));

CREATE OR REPLACE TRIGGER update_organisations_modtime
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── 4. ORGANISATION ↔ SECTORS (many-to-many) ─────────────────
CREATE TABLE IF NOT EXISTS organisation_sectors (
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  sector_id       SMALLINT NOT NULL REFERENCES sectors(id),
  is_primary      BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organisation_id, sector_id)
);

-- ── 5. ORGANISATION ↔ LGA COVERAGE (many-to-many) ────────────
CREATE TABLE IF NOT EXISTS organisation_lgas (
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lga_id          INTEGER NOT NULL REFERENCES lga_gap_scores(id),
  coverage_type   TEXT NOT NULL DEFAULT 'operational',
  evidence_type   TEXT,
  since_year      SMALLINT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organisation_id, lga_id)
);

-- ── 6. PROGRAMMES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programmes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  sector_id       SMALLINT REFERENCES sectors(id),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','completed','suspended')),
  start_date      DATE,
  end_date        DATE,
  budget_range    TEXT,
  beneficiary_count INTEGER,
  beneficiary_types TEXT[],
  ai_categorized  BOOLEAN DEFAULT false,
  ai_extracted    BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE OR REPLACE TRIGGER update_programmes_modtime
  BEFORE UPDATE ON programmes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
