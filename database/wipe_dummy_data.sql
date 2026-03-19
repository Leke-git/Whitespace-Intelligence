-- WHITESPACE Wipe Dummy Data
-- Version 1.0

DELETE FROM organisation_resources WHERE dummy_data = true;
DELETE FROM organisation_gallery WHERE dummy_data = true;
DELETE FROM programmes WHERE dummy_data = true;
DELETE FROM organisations WHERE dummy_data = true;
DELETE FROM lgas WHERE dummy_data = true;
