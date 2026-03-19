-- Migration: Add tables for NGO Proof of Work (Gallery and Resources)
-- Description: Adds organisation_resources and organisation_gallery tables.

-- 1. ORGANISATION RESOURCES (Reports, Case Studies, etc.)
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

-- 2. ORGANISATION GALLERY (Photos of projects/work)
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
ALTER TABLE organisation_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisation_gallery   ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read organisation resources"
  ON organisation_resources FOR SELECT
  USING (true);

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

-- ── TRIGGERS ──────────────────────────────────────────────────
CREATE TRIGGER update_organisation_resources_modtime
  BEFORE UPDATE ON organisation_resources
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
