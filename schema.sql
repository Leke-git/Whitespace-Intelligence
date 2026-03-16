-- Whitespace Database Schema
-- Version: 1.0
-- Description: Schema for NGO registry, coordination maps, and gap analysis.

-- Enable PostGIS for geospatial queries (optional but recommended for future)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ORGANIZATIONS (NGOs)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    name TEXT NOT NULL,
    cac_number TEXT UNIQUE,
    verified_status TEXT NOT NULL DEFAULT 'pending' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
    logo_url TEXT,
    description TEXT,
    contact_email TEXT NOT NULL,
    website_url TEXT,
    hq_address TEXT,
    user_id UUID REFERENCES auth.users(id) -- Link to Supabase Auth
);

-- 2. LGA DATA (774 LGAs)
CREATE TABLE IF NOT EXISTS lga_data (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    population INTEGER,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    need_index NUMERIC(3,2) DEFAULT 0.00 CHECK (need_index >= 0 AND need_index <= 1),
    primary_needs JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. INTERVENTIONS (Coordination Logs)
CREATE TABLE IF NOT EXISTS interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lga_id INTEGER NOT NULL REFERENCES lga_data(id),
    sector TEXT NOT NULL CHECK (sector IN ('Health', 'Education', 'Nutrition', 'WASH', 'Protection', 'Food Security', 'Livelihoods', 'Shelter', 'Other')),
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget_range TEXT, -- e.g., "< 1M", "1M - 5M", "> 5M"
    target_reach INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'suspended')),
    ai_categorized BOOLEAN DEFAULT false
);

-- 4. SITE SETTINGS (Institutional Content)
CREATE TABLE IF NOT EXISTS site_settings (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT
);

-- 5. ADMIN USERS (Owner Credentials)
-- Note: Admin access is typically handled via Supabase Auth roles or a specific table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT DEFAULT 'admin'
);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_modtime BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_interventions_modtime BEFORE UPDATE ON interventions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- RLS POLICIES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lga_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read verified NGOs and LGA data
CREATE POLICY "Public read verified organizations" ON organizations FOR SELECT USING (verified_status = 'verified');
CREATE POLICY "Public read LGA data" ON lga_data FOR SELECT USING (true);
CREATE POLICY "Public read site settings" ON site_settings FOR SELECT USING (true);

-- NGOs can manage their own data
CREATE POLICY "NGOs manage own profile" ON organizations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "NGOs manage own interventions" ON interventions FOR ALL USING (
    EXISTS (SELECT 1 FROM organizations WHERE id = interventions.org_id AND user_id = auth.uid())
);

-- Admin has full access (Service Role)
-- Supabase service_role bypasses RLS by default.

-- SEED DATA (Sample LGAs with Coordinates)
INSERT INTO lga_data (name, state, population, latitude, longitude, need_index, primary_needs) VALUES
('Ikeja', 'Lagos', 313196, 6.5965, 3.3421, 0.15, '["Infrastructure", "Traffic Management"]'),
('Alimosho', 'Lagos', 1288714, 6.6010, 3.2500, 0.42, '["WASH", "Primary Healthcare"]'),
('Kano Municipal', 'Kano', 365525, 11.9964, 8.5167, 0.35, '["Education", "Nutrition"]'),
('Maiduguri', 'Borno', 543016, 11.8333, 13.1500, 0.88, '["Protection", "Food Security", "Shelter"]'),
('Bama', 'Borno', 269986, 11.5221, 13.6856, 0.95, '["Nutrition", "WASH", "Protection"]'),
('Port Harcourt', 'Rivers', 541115, 4.8156, 7.0498, 0.22, '["Livelihoods", "Environmental Protection"]'),
('Abuja Municipal', 'FCT', 776298, 9.0578, 7.4951, 0.18, '["Housing", "Education"]'),
('Jos North', 'Plateau', 429300, 9.9167, 8.9000, 0.55, '["Peacebuilding", "Healthcare"]'),
('Onitsha North', 'Anambra', 125918, 6.1500, 6.7833, 0.30, '["Trade Infrastructure", "WASH"]'),
('Kaduna South', 'Kaduna', 402390, 10.4833, 7.4167, 0.48, '["Education", "Security"]');
