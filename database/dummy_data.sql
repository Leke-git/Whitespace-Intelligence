-- WHITESPACE Dummy Data
-- Version 1.1

-- Seed Site Settings
INSERT INTO site_settings (key, value, description, category) VALUES
('platform_name', 'WHITESPACE', 'The name of the platform', 'branding'),
('hero_title', 'Eliminate the Whitespace in Aid', 'Main landing page title', 'content'),
('verification_fee', '0', 'Fee for NGO verification in NGN', 'business');

-- 1. Organisations
INSERT INTO organisations (legal_name, slug, cac_number, trust_tier, description, mission, impact_summary, email, website, logo_url, hero_image_url, brand_color, testimonial_quote, testimonial_author, address, dummy_data)
VALUES 
('Save the Children Nigeria', 'save-the-children-nigeria', 'CAC/IT/0001', 'verified', 'International NGO focused on child rights and emergency relief.', 'To inspire breakthroughs in the way the world treats children and to achieve immediate and lasting change in their lives.', 'Over 2 million children reached in 2025 across health, education, and protection sectors.', 'info@savethechildren.ng', 'https://nigeria.savethechildren.net', 'https://picsum.photos/seed/stc-logo/200/200', 'https://picsum.photos/seed/stc-hero/1200/600', '#e31b23', 'Whitespace has transformed how we coordinate with local partners in Borno.', 'Dr. Amina Yusuf, Country Director', 'Plot 123, Cadastral Zone, Abuja', true),
('Connected Development (CODE)', 'connected-development', 'CAC/IT/0002', 'verified', 'Non-profit focused on empowering marginalized communities through access to information.', 'To improve governance and accountability through citizen engagement.', 'Tracked over $500M in public funds across 36 states.', 'info@connecteddevelopment.org', 'https://connecteddevelopment.org', 'https://picsum.photos/seed/code-logo/200/200', 'https://picsum.photos/seed/code-hero/1200/600', '#000000', 'The gap intelligence tool is a game-changer for our Follow The Money campaign.', 'Hamzat Lawal, Founder', 'No. 10, Amazon Street, Maitama, Abuja', true),
('Wellbeing Foundation Africa', 'wellbeing-foundation-africa', 'CAC/IT/0003', 'verified', 'Pan-African non-governmental organization focused on maternal and child health.', 'To improve health outcomes for women and children through advocacy and education.', 'Reduced maternal mortality by 15% in target LGAs in Kwara State.', 'info@wbfafrica.org', 'https://wbfafrica.org', 'https://picsum.photos/seed/wbf-logo/200/200', 'https://picsum.photos/seed/wbf-hero/1200/600', '#8e44ad', 'Coordination is the key to sustainable health impact.', 'Toyin Saraki, Founder', 'Lagos, Nigeria', true),
('Borno Relief Agency', 'borno-relief-agency', 'CAC/IT/0004', 'registered', 'Local agency providing immediate relief to IDPs in Borno State.', 'To provide life-saving assistance to those affected by conflict.', 'Distributed food and non-food items to 50,000 IDPs in 2025.', 'contact@bornorelief.org', 'https://bornorelief.org', 'https://picsum.photos/seed/bra-logo/200/200', 'https://picsum.photos/seed/bra-hero/1200/600', '#2980b9', 'We need better visibility on who is doing what in the deep field.', 'Alhaji Bukar, Director', 'Maiduguri, Borno State', true);

-- 2. Programmes
INSERT INTO programmes (organisation_id, name, description, status, beneficiary_count, sector_id, dummy_data)
SELECT id, 'Emergency Nutrition Response', 'Providing therapeutic feeding for children under 5 in IDP camps.', 'active', 15000, 4, true FROM organisations WHERE slug = 'save-the-children-nigeria';
INSERT INTO programmes (organisation_id, name, description, status, beneficiary_count, sector_id, dummy_data)
SELECT id, 'Follow The Money', 'Tracking education and health spending in rural LGAs.', 'active', 250000, 2, true FROM organisations WHERE slug = 'connected-development';
INSERT INTO programmes (organisation_id, name, description, status, beneficiary_count, sector_id, dummy_data)
SELECT id, 'MamaCare Midwifery', 'Antenatal and postnatal care for mothers in rural communities.', 'active', 50000, 1, true FROM organisations WHERE slug = 'wellbeing-foundation-africa';
INSERT INTO programmes (organisation_id, name, description, status, beneficiary_count, sector_id, dummy_data)
SELECT id, 'IDP Camp WASH', 'Providing clean water and sanitation facilities in Maiduguri.', 'active', 10000, 3, true FROM organisations WHERE slug = 'borno-relief-agency';

-- 3. Programme LGAs (Mapping to specific LGAs)
-- Maiduguri (Borno)
INSERT INTO programme_lgas (programme_id, lga_id, dummy_data)
SELECT p.id, l.id, true FROM programmes p, lga_gap_scores l WHERE p.name = 'Emergency Nutrition Response' AND l.name = 'Maiduguri';
INSERT INTO programme_lgas (programme_id, lga_id, dummy_data)
SELECT p.id, l.id, true FROM programmes p, lga_gap_scores l WHERE p.name = 'IDP Camp WASH' AND l.name = 'Maiduguri';

-- Abuja Municipal (FCT)
INSERT INTO programme_lgas (programme_id, lga_id, dummy_data)
SELECT p.id, l.id, true FROM programmes p, lga_gap_scores l WHERE p.name = 'Follow The Money' AND l.name = 'Abuja Municipal';

-- Ilorin West (Kwara)
INSERT INTO programme_lgas (programme_id, lga_id, dummy_data)
SELECT p.id, l.id, true FROM programmes p, lga_gap_scores l WHERE p.name = 'MamaCare Midwifery' AND l.name = 'Ilorin West';

-- 4. Organisation Resources
INSERT INTO organisation_resources (organisation_id, title, description, url, resource_type, file_size, dummy_data)
SELECT id, '2025 Annual Impact Report', 'Comprehensive overview of our activities and impact in Nigeria.', 'https://example.com/report.pdf', 'report', '4.2 MB', true FROM organisations WHERE slug = 'save-the-children-nigeria';
INSERT INTO organisation_resources (organisation_id, title, description, url, resource_type, file_size, dummy_data)
SELECT id, 'Financial Audit 2024', 'Audited financial statements for the 2024 fiscal year.', 'https://example.com/audit.pdf', 'financial_statement', '1.8 MB', true FROM organisations WHERE slug = 'connected-development';

-- 5. Organisation Gallery
INSERT INTO organisation_gallery (organisation_id, image_url, caption, project_name, category, dummy_data)
SELECT id, 'https://picsum.photos/seed/stc-gallery-1/800/800', 'Nutrition screening in Monguno.', 'Emergency Nutrition Response', 'Field Work', true FROM organisations WHERE slug = 'save-the-children-nigeria';
INSERT INTO organisation_gallery (organisation_id, image_url, caption, project_name, category, dummy_data)
SELECT id, 'https://picsum.photos/seed/code-gallery-1/800/800', 'Community engagement session in Kaduna.', 'Follow The Money', 'Community', true FROM organisations WHERE slug = 'connected-development';

-- 6. IATI Funding (Simulated)
INSERT INTO iati_funding (iati_identifier, donor_name, title, amount_usd, transaction_date, lga_id, dummy_data)
SELECT 
  'IATI-NG-' || floor(random() * 1000000)::text,
  CASE floor(random() * 4)
    WHEN 0 THEN 'USAID'
    WHEN 1 THEN 'UK Aid'
    WHEN 2 THEN 'EU'
    ELSE 'World Bank'
  END,
  'Humanitarian Assistance Project',
  (random() * 1500000)::numeric(15,2),
  CURRENT_DATE - (floor(random() * 365) || ' days')::interval,
  id,
  true
FROM lga_gap_scores
WHERE id IN (SELECT id FROM lga_gap_scores LIMIT 50);
