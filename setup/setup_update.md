# Setup Update — 2026-03-24

## Description
Adds `dummy_data` boolean flags to seedable tables to enable safe wipe operations.

## APPLY
1. Open Supabase SQL Editor.
2. Run the migration script: `database/migrations/20260324_001_add_dummy_data_flags.sql`.
3. Verify that the columns `dummy_data` have been added to `programmes`, `lga_gap_scores`, `organisation_resources`, and `organisation_gallery` tables.

## ROLLBACK
1. Open Supabase SQL Editor.
2. Run the rollback script: `database/migrations/20260324_001_add_dummy_data_flags_rollback.sql`.
