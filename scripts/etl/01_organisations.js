#!/usr/bin/env node
/**
 * ETL Script 01: OCHA 3W → organisations seed SQL
 * 
 * Source:  who-is-doing-what-and-where_nga_3w_jul_sept_2025.xlsx
 * Output:  output/seed_organisations.sql
 *          output/seed_organisation_sectors.sql
 *          output/seed_organisation_lgas.sql
 * 
 * Usage: node scripts/etl/01_organisations.js
 * 
 * Prerequisites:
 *   npm install xlsx
 *   Place source file in scripts/etl/data/raw/
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── CONFIG ────────────────────────────────────────────────────────────────────

const SOURCE_FILE = path.join(__dirname, 'data/raw/who-is-doing-what-and-where_nga_3w_jul_sept_2025.xlsx');
const OUTPUT_DIR  = path.join(__dirname, 'output');

// OCHA sector → Whitespace sector slug mapping
// Unmapped sectors are skipped (CCCM, Shelter — not in our 5-sector focus)
const SECTOR_MAP = {
  'Health':                        'health',
  'Water, Sanitation & Hygiene':   'wash',
  'Education':                     'education',
  'Early Recovery & Livelihoods':  'livelihoods',
  'Protection':                    'gbv-protection',
  'Nutrition':                     'health',           // closest match — nutrition is sub-sector of health
  'Food Security':                 'livelihoods',      // food security under livelihoods umbrella
  // Intentionally excluded:
  // 'Camp Coordination & Camp Management' → no equivalent sector
  // 'Shelter & Non Food Items'           → no equivalent sector
};

// OCHA org type → entity_type enum
const ENTITY_TYPE_MAP = {
  'NNGO':      'ngo',
  'INGO':      'ingo',
  'UN Agency': 'ngo',   // won't be imported but mapped for safety
  'Govt':      'government_affiliated',
};

// Organisation types to include (exclude UN agencies and Govt)
const INCLUDE_TYPES = ['NNGO', 'INGO'];

// ── HELPERS ───────────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function shortId(uuid) {
  return uuid.replace(/-/g, '').substring(0, 8);
}

function generateUUID() {
  return crypto.randomUUID();
}

function escapeSql(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Derive a trust_tier from org type and data source
function trustTier(orgType) {
  if (orgType === 'INGO') return 'verified';   // INGOs in OCHA 3W are field-verified
  return 'registered';                          // NNGOs start at registered
}

// Normalise status strings from 3W
function normaliseStatus(status) {
  const s = (status || '').toLowerCase().trim();
  if (s === 'ongoing') return 'active';
  if (s === 'completed') return 'completed';
  if (s === 'suspended') return 'suspended';
  if (s === 'planned') return 'planned';
  if (s === 'closed') return 'completed';
  return 'active';
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

function run() {
  console.log('📂 Reading OCHA 3W source file...');
  const wb = XLSX.readFile(SOURCE_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);
  console.log(`   ${rows.length} activity rows loaded`);

  // ── STEP 1: Build unique org profiles ─────────────────────────────────────
  const orgMap = new Map(); // key: Organisation name

  for (const row of rows) {
    const orgName  = (row['Organisation'] || '').trim();
    const orgType  = (row['Type of Organization'] || '').trim();
    const acronym  = (row['Org. Acronym'] || '').trim();
    const sector   = (row['Project Sector'] || '').trim();
    const state    = (row['State'] || '').trim();
    const lga      = (row['LGA'] || '').trim();
    const lgaPcode = (row['LGA PCode'] || '').trim();
    const status   = (row['Status'] || '').trim();
    const opType   = (row['Operation Type'] || '').trim();

    if (!orgName || !INCLUDE_TYPES.includes(orgType)) continue;

    if (!orgMap.has(orgName)) {
      orgMap.set(orgName, {
        id:          generateUUID(),
        legal_name:  orgName,
        acronym:     acronym || null,
        entity_type: ENTITY_TYPE_MAP[orgType] || 'ngo',
        is_ingo:     orgType === 'INGO',
        trust_tier:  trustTier(orgType),
        data_source: 'ocha_3w',
        sectors:     new Set(),
        lgas:        new Map(), // lga_name → { state, pcode, status }
        statuses:    [],
      });
    }

    const org = orgMap.get(orgName);

    // Accumulate sectors (map to our slugs)
    const mappedSector = SECTOR_MAP[sector];
    if (mappedSector) org.sectors.add(mappedSector);

    // Accumulate LGAs
    if (lga && state) {
      const key = `${lga}__${state}`;
      if (!org.lgas.has(key)) {
        org.lgas.set(key, {
          lga_name:  lga,
          state:     state,
          pcode:     lgaPcode,
          status:    normaliseStatus(status),
          op_type:   opType,
        });
      }
    }

    org.statuses.push(normaliseStatus(status));
  }

  const orgs = Array.from(orgMap.values());
  console.log(`\n✓ Unique organisations extracted: ${orgs.length}`);
  console.log(`  NNGOs: ${orgs.filter(o => !o.is_ingo).length}`);
  console.log(`  INGOs: ${orgs.filter(o => o.is_ingo).length}`);

  // Finalise each org
  for (const org of orgs) {
    // Primary status = most common across activities
    const statusCounts = {};
    for (const s of org.statuses) statusCounts[s] = (statusCounts[s] || 0) + 1;
    org.ngo_status = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];

    // Slug = slugified name + short ID suffix to guarantee uniqueness
    org.slug = `${slugify(org.legal_name)}-${shortId(org.id)}`;

    // Profile status: OCHA entries are pre-populated, not self-registered
    org.profile_status = 'unclaimed';
  }

  // ── STEP 2: Resolve LGA IDs ────────────────────────────────────────────────
  // We don't have the live LGA table here, so we output a lookup-based INSERT
  // that resolves lga_id by matching name + state at insert time.
  // The seed SQL uses a subquery: (SELECT id FROM lga_gap_scores WHERE name = ? AND state = ?)

  // ── STEP 3: Generate organisations SQL ────────────────────────────────────
  console.log('\n📝 Generating seed_organisations.sql...');

  const orgLines = [
    '-- Seed: Real organisations from OCHA 3W Nigeria (Jul-Sept 2025)',
    '-- Source: data.humdata.org — Who Does What Where',
    '-- Generated: ' + new Date().toISOString(),
    '-- DO NOT wipe: these are real entries (dummy_data = false)',
    '',
    '-- Disable triggers for bulk insert performance',
    'SET session_replication_role = replica;',
    '',
    'INSERT INTO organisations (',
    '  id, slug, legal_name, acronym, entity_type, is_ingo,',
    '  trust_tier, profile_status, data_source, status,',
    '  dummy_data, created_at, updated_at',
    ') VALUES',
  ];

  const orgValues = orgs.map((org, i) => {
    const comma = i < orgs.length - 1 ? ',' : '';
    return [
      `  (`,
      `    ${escapeSql(org.id)},`,
      `    ${escapeSql(org.slug)},`,
      `    ${escapeSql(org.legal_name)},`,
      `    ${escapeSql(org.acronym)},`,
      `    '${org.entity_type}',`,
      `    ${org.is_ingo},`,
      `    '${org.trust_tier}',`,
      `    '${org.profile_status}',`,
      `    'ocha_3w',`,
      `    'active',`,
      `    false,`,
      `    now(),`,
      `    now()`,
      `  )${comma}`,
    ].join('\n');
  });

  orgLines.push(...orgValues);
  orgLines.push(';', '');
  orgLines.push('SET session_replication_role = DEFAULT;', '');

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seed_organisations.sql'),
    orgLines.join('\n')
  );
  console.log(`   ✓ ${orgs.length} organisations written`);

  // ── STEP 4: Generate organisation_sectors SQL ─────────────────────────────
  console.log('\n📝 Generating seed_organisation_sectors.sql...');

  const sectorLines = [
    '-- Seed: Organisation ↔ sector mappings from OCHA 3W',
    '-- Generated: ' + new Date().toISOString(),
    '',
    'INSERT INTO organisation_sectors (organisation_id, sector_id, is_primary)',
    'SELECT o.id, s.id, rank = 1 AS is_primary',
    'FROM (',
    '  VALUES',
  ];

  const sectorValues = [];
  for (const org of orgs) {
    const sectorsArr = Array.from(org.sectors);
    sectorsArr.forEach((sectorSlug, rank) => {
      sectorValues.push(
        `    (${escapeSql(org.id)}, ${escapeSql(sectorSlug)}, ${rank + 1})`
      );
    });
  }

  // Use a clean approach: direct join on slug
  const sectorInsertLines = [
    '-- Seed: Organisation ↔ sector mappings from OCHA 3W',
    '-- Generated: ' + new Date().toISOString(),
    '',
  ];

  for (const org of orgs) {
    const sectorsArr = Array.from(org.sectors);
    sectorsArr.forEach((sectorSlug, rank) => {
      sectorInsertLines.push(
        `INSERT INTO organisation_sectors (organisation_id, sector_id, is_primary)` +
        ` SELECT ${escapeSql(org.id)}, id, ${rank === 0}` +
        ` FROM sectors WHERE slug = ${escapeSql(sectorSlug)};`
      );
    });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seed_organisation_sectors.sql'),
    sectorInsertLines.join('\n')
  );

  const totalSectorLinks = orgs.reduce((n, o) => n + o.sectors.size, 0);
  console.log(`   ✓ ${totalSectorLinks} sector links written`);

  // ── STEP 5: Generate organisation_lgas SQL ────────────────────────────────
  console.log('\n📝 Generating seed_organisation_lgas.sql...');

  const lgaInsertLines = [
    '-- Seed: Organisation ↔ LGA coverage from OCHA 3W',
    '-- Generated: ' + new Date().toISOString(),
    '-- lga_id resolved by name + state match against lga_gap_scores',
    '-- Rows with no LGA match are silently skipped (WHERE l.id IS NOT NULL)',
    '',
  ];

  // Track unmatched LGAs for the report
  const lgaInserts = [];

  for (const org of orgs) {
    for (const [, lgaData] of org.lgas) {
      lgaInserts.push(
        `INSERT INTO organisation_lgas (organisation_id, lga_id, coverage_type, evidence_type)\n` +
        `SELECT ${escapeSql(org.id)}, l.id, 'operational', 'ocha_3w'\n` +
        `FROM lga_gap_scores l\n` +
        `WHERE l.name = ${escapeSql(lgaData.lga_name)} AND l.state = ${escapeSql(lgaData.state)}\n` +
        `ON CONFLICT (organisation_id, lga_id) DO NOTHING;`
      );
    }
  }

  lgaInsertLines.push(...lgaInserts);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seed_organisation_lgas.sql'),
    lgaInsertLines.join('\n')
  );

  const totalLgaLinks = orgs.reduce((n, o) => n + o.lgas.size, 0);
  console.log(`   ✓ ${totalLgaLinks} LGA coverage links written`);

  // ── STEP 6: Summary report ────────────────────────────────────────────────
  console.log('\n── SUMMARY ──────────────────────────────────────────────');
  console.log(`Organisations:     ${orgs.length}`);
  console.log(`  NNGOs:           ${orgs.filter(o => !o.is_ingo).length}`);
  console.log(`  INGOs:           ${orgs.filter(o => o.is_ingo).length}`);
  console.log(`Sector links:      ${totalSectorLinks}`);
  console.log(`LGA coverage rows: ${totalLgaLinks}`);
  console.log(`\nStates covered:    Adamawa, Borno, Yobe (3W scope)`);
  console.log(`\nOutput files:`);
  console.log(`  output/seed_organisations.sql`);
  console.log(`  output/seed_organisation_sectors.sql`);
  console.log(`  output/seed_organisation_lgas.sql`);
  console.log('\n✅ ETL complete. Review output files before running in Supabase.');

  // Write a JSON manifest for the next ETL step
  const manifest = orgs.map(o => ({
    id: o.id,
    legal_name: o.legal_name,
    acronym: o.acronym,
    entity_type: o.entity_type,
    sectors: Array.from(o.sectors),
    lgas: Array.from(o.lgas.values()).map(l => ({ name: l.lga_name, state: l.state })),
  }));

  fs.writeFileSync(
    path.join(__dirname, 'data/processed/organisations_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('\n📋 organisations_manifest.json written for downstream ETL steps.');
}

run();
