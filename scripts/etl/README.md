# Whitespace ETL Pipeline

Transforms public data sources into seed SQL for the Whitespace database.

## Pipeline overview

```
data/raw/          ← drop source files here
  └── who-is-doing-what-and-where_nga_3w_jul_sept_2025.xlsx

scripts/etl/
  ├── 01_organisations.js       → seed_organisations.sql
  │                               seed_organisation_sectors.sql
  │                               seed_organisation_lgas.sql
  │                               data/processed/organisations_manifest.json
  │
  └── 02_sector_gap_scores.js   → seed_lga_sector_gap_scores.sql

output/
  ├── seed_organisations.sql
  ├── seed_organisation_sectors.sql
  ├── seed_organisation_lgas.sql
  └── seed_lga_sector_gap_scores.sql
```

## Setup

```bash
cd scripts/etl
npm install xlsx
```

## Run order

```bash
# Step 1 — extract orgs from OCHA 3W
node 01_organisations.js

# Step 2 — compute sector gap scores
node 02_sector_gap_scores.js
```

## Apply to Supabase

Run output SQL files in this order in the Supabase SQL Editor:

1. `seed_organisations.sql`
2. `seed_organisation_sectors.sql`
3. `seed_organisation_lgas.sql`
4. `seed_lga_sector_gap_scores.sql`

## Important notes

- All seeded organisations have `dummy_data = false` — they are never wiped
- LGA matching uses name + state string match against `lga_gap_scores`
- Unmatched LGAs are silently skipped (ON CONFLICT DO NOTHING)
- Need scores in `seed_lga_sector_gap_scores.sql` are **state-level proxies**
  until LGA-level indicator data (NDHS, NBS MPI, ACLED) is integrated

## Data sources

| File | Source | Coverage |
|---|---|---|
| OCHA 3W Jul-Sept 2025 | data.humdata.org | Adamawa, Borno, Yobe |
| IATI activity locations | d-portal.org | Donors only — not used for orgs |

## Next indicator datasets to integrate (Phase 2)

| Sector | Dataset | Source | LGA level? |
|---|---|---|---|
| Health | NDHS 2021 key indicators | dhsprogram.com | State (disaggregate by pop) |
| WASH | JMP Nigeria | washdata.org | State |
| Education | UNICEF OOSC data | unicef.org | State |
| Livelihoods | NBS MPI 2022 | nigerianstat.gov.ng | LGA ✓ |
| GBV/Protection | IOM DTM Nigeria | dtm.iom.int | LGA ✓ |
| GBV/Protection | ACLED Nigeria | acleddata.com | LGA (event-based) |
