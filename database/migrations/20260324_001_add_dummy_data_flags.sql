-- Migration: Add dummy_data flags to seedable tables
-- Date: 2026-03-24
-- Description: Adds dummy_data boolean to tables that receive 
--              seeded or demo content, enabling safe wipe operations.

ALTER TABLE programmes
  ADD COLUMN IF NOT EXISTS dummy_data BOOLEAN DEFAULT false;

ALTER TABLE lga_gap_scores
  ADD COLUMN IF NOT EXISTS dummy_data BOOLEAN DEFAULT false;

ALTER TABLE organisation_resources
  ADD COLUMN IF NOT EXISTS dummy_data BOOLEAN DEFAULT false;

ALTER TABLE organisation_gallery
  ADD COLUMN IF NOT EXISTS dummy_data BOOLEAN DEFAULT false;
