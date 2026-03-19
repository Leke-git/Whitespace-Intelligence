-- WHITESPACE Dummy Data
-- Version 1.0

-- Seed Site Settings
INSERT INTO site_settings (key, value, description, category) VALUES
('platform_name', 'WHITESPACE', 'The name of the platform', 'branding'),
('hero_title', 'Eliminate the Whitespace in Aid', 'Main landing page title', 'content'),
('verification_fee', '0', 'Fee for NGO verification in NGN', 'business');

-- Seed Organisations
INSERT INTO organisations (legal_name, slug, description, trust_tier, cac_number, dummy_data) VALUES
('Health for All Foundation', 'health-for-all', 'Providing primary healthcare in rural areas.', 'verified', 'CAC123456', true),
('Education First Initiative', 'education-first', 'Building schools and training teachers.', 'registered', 'CAC789012', true);

-- Seed LGAs (Sample)
INSERT INTO lgas (name, state, gap_score, dummy_data) VALUES
('Maiduguri', 'Borno', 0.85, true),
('Ikeja', 'Lagos', 0.15, true),
('Kano Municipal', 'Kano', 0.45, true);
