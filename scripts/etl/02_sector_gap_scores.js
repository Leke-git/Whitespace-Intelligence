#!/usr/bin/env node
/**
 * ETL Script 02: Compute lga_sector_gap_scores
 *
 * Uses the organisation_manifest from step 01 to compute
 * initial coverage scores per LGA per sector.
 * Need scores use placeholder state-level proxies until
 * full indicator datasets (NDHS, NBS MPI, ACLED) are integrated.
 *
 * Output: output/seed_lga_sector_gap_scores.sql
 *
 * Usage: node scripts/etl/02_sector_gap_scores.js
 * Run AFTER 01_organisations.js
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { computeGapScore, clamp } = require('./utils/normalise');

// ── CONFIG ────────────────────────────────────────────────────────────────────

const MANIFEST_FILE = path.join(__dirname, 'data/processed/organisations_manifest.json');
const OUTPUT_DIR    = path.join(__dirname, 'output');

// The 5 priority sectors and their gap weighting (need vs coverage)
// These match the formulas designed in the planning phase
const SECTORS = {
  'health':        { needWeight: 0.55, label: 'Health' },
  'wash':          { needWeight: 0.50, label: 'WASH' },
  'education':     { needWeight: 0.45, label: 'Education' },
  'livelihoods':   { needWeight: 0.50, label: 'Livelihoods' },
  'gbv-protection':{ needWeight: 0.60, label: 'GBV & Protection' },
};

// State-level need proxies (0–1) derived from publicly available data.
// These are conservative estimates used until LGA-level indicators are integrated.
// Sources: NDHS 2021, NBS MPI 2022, IOM DTM, ACLED Nigeria
// Borno, Yobe, Adamawa ranked highest need by every major index.
// All other states default to 0.35 (moderate need) until updated by 01_lga_indicators.js
const STATE_NEED_PROXIES = {
  // Northeast — crisis states
  'Borno':    { health: 0.92, wash: 0.89, education: 0.91, livelihoods: 0.88, 'gbv-protection': 0.95 },
  'Yobe':     { health: 0.85, wash: 0.82, education: 0.88, livelihoods: 0.83, 'gbv-protection': 0.87 },
  'Adamawa':  { health: 0.78, wash: 0.75, education: 0.80, livelihoods: 0.76, 'gbv-protection': 0.82 },

  // Northwest — high poverty, conflict
  'Zamfara':  { health: 0.75, wash: 0.72, education: 0.78, livelihoods: 0.74, 'gbv-protection': 0.78 },
  'Katsina':  { health: 0.70, wash: 0.68, education: 0.75, livelihoods: 0.70, 'gbv-protection': 0.72 },
  'Sokoto':   { health: 0.72, wash: 0.70, education: 0.76, livelihoods: 0.71, 'gbv-protection': 0.73 },
  'Kebbi':    { health: 0.65, wash: 0.63, education: 0.70, livelihoods: 0.65, 'gbv-protection': 0.65 },
  'Niger':    { health: 0.60, wash: 0.58, education: 0.65, livelihoods: 0.60, 'gbv-protection': 0.62 },
  'Kaduna':   { health: 0.62, wash: 0.60, education: 0.65, livelihoods: 0.62, 'gbv-protection': 0.70 },
  'Kano':     { health: 0.55, wash: 0.52, education: 0.60, livelihoods: 0.55, 'gbv-protection': 0.55 },
  'Jigawa':   { health: 0.68, wash: 0.65, education: 0.72, livelihoods: 0.67, 'gbv-protection': 0.65 },

  // North Central
  'Benue':    { health: 0.60, wash: 0.58, education: 0.55, livelihoods: 0.62, 'gbv-protection': 0.68 },
  'Plateau':  { health: 0.58, wash: 0.55, education: 0.55, livelihoods: 0.58, 'gbv-protection': 0.65 },
  'Nassarawa':{ health: 0.55, wash: 0.53, education: 0.52, livelihoods: 0.55, 'gbv-protection': 0.58 },
  'Kogi':     { health: 0.55, wash: 0.52, education: 0.52, livelihoods: 0.55, 'gbv-protection': 0.55 },
  'Kwara':    { health: 0.48, wash: 0.45, education: 0.48, livelihoods: 0.50, 'gbv-protection': 0.48 },
  'FCT':      { health: 0.30, wash: 0.28, education: 0.30, livelihoods: 0.32, 'gbv-protection': 0.30 },
  'Taraba':   { health: 0.65, wash: 0.63, education: 0.65, livelihoods: 0.65, 'gbv-protection': 0.70 },
  'Gombe':    { health: 0.62, wash: 0.60, education: 0.63, livelihoods: 0.62, 'gbv-protection': 0.65 },
  'Bauchi':   { health: 0.65, wash: 0.62, education: 0.68, livelihoods: 0.64, 'gbv-protection': 0.65 },

  // Southeast
  'Enugu':    { health: 0.45, wash: 0.42, education: 0.38, livelihoods: 0.48, 'gbv-protection': 0.45 },
  'Anambra':  { health: 0.40, wash: 0.38, education: 0.35, livelihoods: 0.42, 'gbv-protection': 0.42 },
  'Imo':      { health: 0.45, wash: 0.43, education: 0.40, livelihoods: 0.50, 'gbv-protection': 0.50 },
  'Abia':     { health: 0.43, wash: 0.40, education: 0.38, livelihoods: 0.45, 'gbv-protection': 0.45 },
  'Ebonyi':   { health: 0.58, wash: 0.55, education: 0.52, livelihoods: 0.60, 'gbv-protection': 0.55 },

  // South-South
  'Delta':    { health: 0.45, wash: 0.42, education: 0.40, livelihoods: 0.48, 'gbv-protection': 0.48 },
  'Rivers':   { health: 0.42, wash: 0.40, education: 0.38, livelihoods: 0.45, 'gbv-protection': 0.50 },
  'Bayelsa':  { health: 0.55, wash: 0.58, education: 0.50, livelihoods: 0.55, 'gbv-protection': 0.52 },
  'Cross River':{ health: 0.52, wash: 0.50, education: 0.48, livelihoods: 0.55, 'gbv-protection': 0.52 },
  'Akwa Ibom':{ health: 0.48, wash: 0.45, education: 0.42, livelihoods: 0.50, 'gbv-protection': 0.50 },
  'Edo':      { health: 0.45, wash: 0.42, education: 0.40, livelihoods: 0.48, 'gbv-protection': 0.52 },

  // Southwest
  'Lagos':    { health: 0.35, wash: 0.33, education: 0.30, livelihoods: 0.38, 'gbv-protection': 0.40 },
  'Ogun':     { health: 0.38, wash: 0.35, education: 0.33, livelihoods: 0.40, 'gbv-protection': 0.38 },
  'Oyo':      { health: 0.42, wash: 0.40, education: 0.38, livelihoods: 0.44, 'gbv-protection': 0.42 },
  'Osun':     { health: 0.42, wash: 0.40, education: 0.38, livelihoods: 0.44, 'gbv-protection': 0.42 },
  'Ondo':     { health: 0.45, wash: 0.43, education: 0.40, livelihoods: 0.47, 'gbv-protection': 0.45 },
  'Ekiti':    { health: 0.43, wash: 0.40, education: 0.38, livelihoods: 0.45, 'gbv-protection': 0.43 },
};

const DEFAULT_NEED = { health: 0.35, wash: 0.35, education: 0.35, livelihoods: 0.35, 'gbv-protection': 0.35 };

function escapeSql(str) {
  if (str == null) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function generateUUID() {
  return crypto.randomUUID();
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    console.error('❌ organisations_manifest.json not found. Run 01_organisations.js first.');
    process.exit(1);
  }

  const orgs = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  console.log(`📂 Loaded ${orgs.length} organisations from manifest`);

  // Build LGA → sector → org count map
  // key: "lga_name__state", value: { sector_slug: count }
  const lgaSectorCounts = new Map();

  for (const org of orgs) {
    for (const lga of org.lgas) {
      const key = `${lga.name}__${lga.state}`;
      if (!lgaSectorCounts.has(key)) {
        lgaSectorCounts.set(key, { _meta: { lga_name: lga.name, state: lga.state } });
      }
      const entry = lgaSectorCounts.get(key);
      for (const sector of org.sectors) {
        if (SECTORS[sector]) {
          entry[sector] = (entry[sector] || 0) + 1;
        }
      }
    }
  }

  console.log(`✓ ${lgaSectorCounts.size} unique LGAs with NGO coverage data`);

  // Generate SQL
  const lines = [
    '-- Seed: LGA sector gap scores (Phase 1 — coverage-based)',
    '-- Need scores: state-level proxies (NDHS 2021 + NBS MPI 2022 basis)',
    '-- Coverage scores: computed from OCHA 3W verified NGO counts',
    '-- Generated: ' + new Date().toISOString(),
    '-- These will be updated by the nightly compute job once the platform has live data.',
    '',
  ];

  let rowCount = 0;

  for (const [key, entry] of lgaSectorCounts) {
    const { lga_name, state } = entry._meta;
    const stateNeeds = STATE_NEED_PROXIES[state] || DEFAULT_NEED;

    for (const [sectorSlug, config] of Object.entries(SECTORS)) {
      const ngoCount     = entry[sectorSlug] || 0;
      const needScore    = stateNeeds[sectorSlug] || DEFAULT_NEED[sectorSlug];

      // Coverage: normalise NGO count against a reasonable max
      // 5+ verified NGOs in a sector = fully covered for Phase 1 purposes
      const MAX_NGO_COVERAGE = 5;
      const coverageScore = clamp(ngoCount / MAX_NGO_COVERAGE);

      const gapScore = computeGapScore(needScore, coverageScore, config.needWeight);

      lines.push(
        `INSERT INTO lga_sector_gap_scores`,
        `  (id, lga_id, sector_id, gap_score, needs_score, weighted_supply,`,
        `   ngo_count_total, ngo_count_verified, computed_at)`,
        `SELECT`,
        `  ${escapeSql(generateUUID())},`,
        `  l.id,`,
        `  s.id,`,
        `  ${gapScore.toFixed(4)},`,
        `  ${needScore.toFixed(4)},`,
        `  ${coverageScore.toFixed(4)},`,
        `  ${ngoCount},`,
        `  ${ngoCount},`,  // all OCHA-sourced = verified
        `  now()`,
        `FROM lga_gap_scores l`,
        `JOIN sectors s ON s.slug = ${escapeSql(sectorSlug)}`,
        `WHERE l.name = ${escapeSql(lga_name)} AND l.state = ${escapeSql(state)}`,
        `ON CONFLICT (lga_id, sector_id, computed_at) DO NOTHING;`,
        '',
      );

      rowCount++;
    }
  }

  // Also insert rows for all remaining LGAs (no NGO coverage = max gap in covered sectors)
  lines.push('-- LGAs with no OCHA 3W coverage — need scores only, coverage = 0');
  lines.push('-- These are inserted for all 774 LGAs × 5 sectors not already covered above');
  lines.push('');
  lines.push(`INSERT INTO lga_sector_gap_scores`);
  lines.push(`  (id, lga_id, sector_id, gap_score, needs_score, weighted_supply,`);
  lines.push(`   ngo_count_total, ngo_count_verified, computed_at)`);
  lines.push(`SELECT`);
  lines.push(`  gen_random_uuid(),`);
  lines.push(`  l.id,`);
  lines.push(`  s.id,`);
  lines.push(`  -- gap_score: use need_index as proxy when no coverage data`);
  lines.push(`  GREATEST(0.35, l.need_index),`);
  lines.push(`  l.need_index,`);
  lines.push(`  0,`);
  lines.push(`  0,`);
  lines.push(`  0,`);
  lines.push(`  now()`);
  lines.push(`FROM lga_gap_scores l`);
  lines.push(`CROSS JOIN sectors s`);
  lines.push(`WHERE s.slug IN ('health','wash','education','livelihoods','gbv-protection')`);
  lines.push(`AND NOT EXISTS (`);
  lines.push(`  SELECT 1 FROM lga_sector_gap_scores x`);
  lines.push(`  WHERE x.lga_id = l.id AND x.sector_id = s.id`);
  lines.push(`)`);
  lines.push(`ON CONFLICT (lga_id, sector_id, computed_at) DO NOTHING;`);

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'seed_lga_sector_gap_scores.sql'),
    lines.join('\n')
  );

  console.log(`\n── SUMMARY ──────────────────────────────────────────────`);
  console.log(`LGAs with coverage data: ${lgaSectorCounts.size}`);
  console.log(`Sector gap score rows:   ${rowCount} (coverage-based)`);
  console.log(`Remaining LGA rows:      inserted via bulk SELECT for all 774 × 5`);
  console.log(`\nOutput: output/seed_lga_sector_gap_scores.sql`);
  console.log(`\n✅ ETL complete.`);
  console.log(`\n⚠️  NOTE: Need scores are state-level proxies.`);
  console.log(`   Replace with LGA-level indicators when NDHS/NBS/ACLED data is integrated.`);
}

run();
