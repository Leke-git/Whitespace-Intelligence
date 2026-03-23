-- Whitespace Database Schema
-- Version: 2.0 (aligned with PRD v3)
-- Description: Extended schema for NGO registry, coordination maps, and gap analysis.

-- ── EXTENSIONS ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS postgis; -- Note: PostGIS might require superuser or specific environment support
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- fuzzy name search

-- ── ENUMS ────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE trust_tier AS ENUM (
      'registered',    -- CAC number submitted
      'verified',      -- CAC + document + active email
      'active',        -- Verified + programme activity in 12mo
      'accredited'     -- Active + peer endorsements
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_status AS ENUM (
      'unclaimed',       -- Pre-populated from public sources; org has not logged in
      'claimed',         -- Org confirmed existence; coverage unverified
      'self_registered'  -- Org registered directly
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE data_source AS ENUM (
      'cac',             -- CAC Incorporated Trustees register
      'ocha_3w',         -- OCHA Nigeria 3W (humanitarian NGOs only)
      'nnngo_public',    -- NNNGO public member directory
      'self_registered', -- Organisation registered directly
      'admin_import'     -- Platform admin import
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE entity_type AS ENUM (
      'ngo', 'cbo', 'foundation', 'social_enterprise',
      'ingo', 'network', 'faith_based', 'government_affiliated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ngo_status AS ENUM (
      'active', 'inactive', 'dormant', 'suspended', 'deregistered'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

  -- Identity
  slug          TEXT NOT NULL UNIQUE,
  legal_name    TEXT NOT NULL,
  trade_name    TEXT,
  acronym       TEXT,
  entity_type   entity_type NOT NULL DEFAULT 'ngo',

  -- Registration
  cac_number    TEXT UNIQUE,
  cac_verified  BOOLEAN DEFAULT false,
  cac_verified_at TIMESTAMPTZ,
  year_founded  SMALLINT,

  -- Trust & profile status
  trust_tier    trust_tier NOT NULL DEFAULT 'registered',
  trust_score   SMALLINT DEFAULT 0,
  profile_status profile_status NOT NULL DEFAULT 'self_registered',
  claimed_at    TIMESTAMPTZ,
  data_source   data_source NOT NULL DEFAULT 'self_registered',
  data_source_ref TEXT,

  -- Removal
  removal_requested    BOOLEAN DEFAULT false,
  removal_requested_at TIMESTAMPTZ,
  removal_reason       TEXT,

  -- Status
  status        ngo_status NOT NULL DEFAULT 'active',
  is_ingo       BOOLEAN DEFAULT false,

  -- Description
  mission       TEXT,
  description   TEXT,
  impact_summary TEXT,

  -- Branding
  hero_image_url TEXT,
  brand_color    TEXT, -- Hex code
  testimonial_quote TEXT,
  testimonial_author TEXT,

  -- Contact
  website       TEXT,
  email         TEXT,
  phone         TEXT,
  address       TEXT,
  lga_id        INTEGER REFERENCES lga_gap_scores(id),

  -- Social
  twitter_handle TEXT,
  linkedin_url   TEXT,

  -- Scale
  staff_count_range   TEXT CHECK (staff_count_range IN ('1-5','6-10','11-50','51-200','200+')),
  annual_budget_range TEXT CHECK (annual_budget_range IN ('under-10m','10m-50m','50m-200m','200m+')),

  -- Data freshness
  last_activity_at     TIMESTAMPTZ,
  last_declaration_at  TIMESTAMPTZ,
  next_declaration_due DATE,
  staleness_flag       BOOLEAN DEFAULT false,

  -- Link to auth (Supabase)
  user_id       UUID REFERENCES auth.users(id),

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

CREATE TRIGGER update_organisations_modtime
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
  evidence_type   TEXT,  -- 'self_declared','ocha_3w','annual_report','admin_confirmed'
  since_year      SMALLINT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (organisation_id, lga_id)
);

-- LGA coverage history (append-only)
CREATE TABLE IF NOT EXISTS organisation_lga_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  lga_id          INTEGER NOT NULL REFERENCES lga_gap_scores(id),
  added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at      TIMESTAMPTZ,
  added_by        TEXT NOT NULL DEFAULT 'self_registration',
  evidence_type   TEXT
);

-- ── 6. PROGRAMMES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programmes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,

  name            TEXT NOT NULL,
  description     TEXT,
  sector_id       SMALLINT REFERENCES sectors(id),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('planned','active','completed','suspended')),

  start_date      DATE,
  end_date        DATE,
  budget_range    TEXT,
  beneficiary_count INTEGER,
  beneficiary_types TEXT[],  -- ['women','children','IDPs']

  ai_categorized  BOOLEAN DEFAULT false,
  ai_extracted    BOOLEAN DEFAULT false,  -- extracted from annual report

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

-- Programme ↔ LGA coverage
CREATE TABLE IF NOT EXISTS programme_lgas (
  programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  lga_id       INTEGER NOT NULL REFERENCES lga_gap_scores(id),
  PRIMARY KEY (programme_id, lga_id)
);

CREATE TRIGGER update_programmes_modtime
  BEFORE UPDATE ON programmes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── 7. VERIFICATION EVENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  admin_id        UUID REFERENCES auth.users(id),
  outcome         TEXT NOT NULL
                  CHECK (outcome IN ('approved_full','approved_partial','rejected','request_more_info','flagged_fraud')),
  reason_codes    TEXT[],
  lga_ids_confirmed INTEGER[],
  lga_ids_rejected  INTEGER[],
  notes           TEXT,
  fraud_confirmed BOOLEAN,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 8. FRAUD REPORTS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  reporter_id     UUID REFERENCES auth.users(id),
  reason          TEXT NOT NULL,
  evidence_url    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','investigating','confirmed','dismissed')),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 9. SECTOR GAP SCORES (nightly computed) ───────────────────
CREATE TABLE IF NOT EXISTS lga_sector_gap_scores (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lga_id          INTEGER NOT NULL REFERENCES lga_gap_scores(id),
  sector_id       SMALLINT REFERENCES sectors(id),  -- NULL = all sectors
  gap_score       NUMERIC(5,4) NOT NULL,
  weighted_supply NUMERIC(8,4),
  needs_score     NUMERIC(5,4),
  ngo_count_total SMALLINT DEFAULT 0,
  ngo_count_unclaimed SMALLINT DEFAULT 0,
  ngo_count_claimed   SMALLINT DEFAULT 0,
  ngo_count_verified  SMALLINT DEFAULT 0,
  computed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lga_id, sector_id, computed_at)
);

CREATE INDEX IF NOT EXISTS gap_scores_lga_idx     ON lga_sector_gap_scores(lga_id);
CREATE INDEX IF NOT EXISTS gap_scores_sector_idx  ON lga_sector_gap_scores(sector_id);
CREATE INDEX IF NOT EXISTS gap_scores_computed_idx ON lga_sector_gap_scores(computed_at DESC);

-- ── 10. GRANT OPPORTUNITIES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS grant_opportunities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  funder          TEXT NOT NULL,
  description     TEXT,
  amount_min_usd  INTEGER,
  amount_max_usd  INTEGER,
  deadline        DATE,
  url             TEXT,
  sector_ids      SMALLINT[],
  lga_ids         INTEGER[],
  is_open         BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── 11. ML FEATURE STORE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS organisation_ml_features (
  organisation_id       UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  computed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Activity signals
  days_since_login          INTEGER,
  days_since_profile_update INTEGER,
  declaration_missed        BOOLEAN DEFAULT false,

  -- Coverage signals
  lga_count_claimed         SMALLINT,
  lga_without_evidence_pct  NUMERIC(5,4),
  ocha_lga_overlap_pct      NUMERIC(5,4),

  -- External liveness
  website_live              BOOLEAN,
  email_valid               BOOLEAN,
  social_active_90d         BOOLEAN,

  -- Rule-based Phase 1 scores
  veracity_score_rulebase   NUMERIC(5,4),
  survival_score_rulebase   NUMERIC(5,4),
  fraud_risk_rulebase       NUMERIC(5,4),

  -- Composite quality score (used in gap score weighting)
  composite_quality_score   NUMERIC(5,4),

  PRIMARY KEY (organisation_id, computed_at)
);

-- ── 12. EXTERNAL EVENTS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS external_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL
               CHECK (event_type IN ('flood','conflict','displacement','disease_outbreak','drought','political_crisis','economic_shock','other')),
  title        TEXT NOT NULL,
  description  TEXT,
  severity     SMALLINT CHECK (severity BETWEEN 1 AND 5),
  lga_ids      INTEGER[],
  started_at   DATE NOT NULL,
  ended_at     DATE,
  source       TEXT NOT NULL,
  source_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 13. FUNDING EVENTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS funding_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor        TEXT NOT NULL,
  call_title   TEXT NOT NULL,
  sector_ids   SMALLINT[],
  lga_ids      INTEGER[],
  amount_usd   INTEGER,
  opened_at    DATE NOT NULL,
  closed_at    DATE,
  source_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ── 14. AUDIT LOG ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  actor_id    UUID REFERENCES auth.users(id),
  actor_type  TEXT NOT NULL DEFAULT 'user',
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID NOT NULL,
  before_data JSONB,
  after_data  JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ── 15. ORGANISATION RESOURCES (Reports, Case Studies, etc.) ──
CREATE TABLE IF NOT EXISTS organisation_resources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  url           TEXT NOT NULL, -- URL to the file (PDF, doc, etc.)
  resource_type TEXT NOT NULL DEFAULT 'report' 
                CHECK (resource_type IN ('report', 'case_study', 'financial_statement', 'policy', 'other')),
  file_size     TEXT, -- e.g., '2.4 MB'
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── 16. ORGANISATION GALLERY (Photos of projects/work) ────────
CREATE TABLE IF NOT EXISTS organisation_gallery (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  programme_id  UUID REFERENCES programmes(id) ON DELETE SET NULL, -- Optional link to a specific programme
  image_url     TEXT NOT NULL,
  caption       TEXT,
  project_name  TEXT, -- Can be different from programme name or for general work
  category      TEXT, -- e.g., 'Field Work', 'Event', 'Impact'
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ── RLS POLICIES ──────────────────────────────────────────────
ALTER TABLE organisations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_lgas   ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lga_gap_scores      ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_gallery   ENABLE ROW LEVEL SECURITY;

-- Public can read non-deleted organisations
CREATE POLICY "Public read organisations"
  ON organisations FOR SELECT
  USING (deleted_at IS NULL AND removal_requested = false);

-- NGOs manage their own profile
CREATE POLICY "NGOs manage own organisation"
  ON organisations FOR ALL
  USING (auth.uid() = user_id);

-- Public read LGA gap scores
CREATE POLICY "Public read gap scores"
  ON lga_gap_scores FOR SELECT
  USING (true);

-- NGOs manage own programmes
CREATE POLICY "NGOs manage own programmes"
  ON programmes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organisations
      WHERE id = programmes.organisation_id
      AND user_id = auth.uid()
    )
  );

-- Public read programmes
CREATE POLICY "Public read programmes"
  ON programmes FOR SELECT
  USING (deleted_at IS NULL);

-- Public read organisation resources
CREATE POLICY "Public read organisation resources"
  ON organisation_resources FOR SELECT
  USING (true);

-- Public read organisation gallery
CREATE POLICY "Public read organisation gallery"
  ON organisation_gallery FOR SELECT
  USING (true);

-- NGOs manage their own resources
CREATE POLICY "NGOs manage own resources"
  ON organisation_resources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organisations
      WHERE id = organisation_resources.organisation_id
      AND user_id = auth.uid()
    )
  );

-- NGOs manage their own gallery
CREATE POLICY "NGOs manage own gallery"
  ON organisation_gallery FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organisations
      WHERE id = organisation_gallery.organisation_id
      AND user_id = auth.uid()
    )
  );

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS grant_opp_deadline_idx ON grant_opportunities(deadline);
CREATE INDEX IF NOT EXISTS grant_opp_open_idx     ON grant_opportunities(is_open);
CREATE INDEX IF NOT EXISTS ext_events_lga_idx     ON external_events USING GIN(lga_ids);
CREATE INDEX IF NOT EXISTS funding_events_sector_idx ON funding_events USING GIN(sector_ids);

-- ── TRIGGERS ──────────────────────────────────────────────────
CREATE TRIGGER update_organisation_resources_modtime
  BEFORE UPDATE ON organisation_resources
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
