-- Add branding fields to organisations table for landing pages

ALTER TABLE organisations ADD COLUMN IF NOT EXISTS impact_summary TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS brand_color TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS testimonial_quote TEXT;
ALTER TABLE organisations ADD COLUMN IF NOT EXISTS testimonial_author TEXT;
