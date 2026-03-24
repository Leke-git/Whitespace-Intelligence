-- WHITESPACE Wipe Dummy Data
-- Version 1.1

-- Delete in reverse dependency order
DELETE FROM iati_funding WHERE dummy_data = true;
DELETE FROM organisation_gallery WHERE dummy_data = true;
DELETE FROM organisation_resources WHERE dummy_data = true;
DELETE FROM programme_lgas WHERE dummy_data = true;
DELETE FROM programmes WHERE dummy_data = true;
DELETE FROM organisations WHERE dummy_data = true;
