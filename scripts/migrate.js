const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ ERROR: SUPABASE_DB_URL secret is not set in GitHub Secrets.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database.');

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        run_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No migrations directory found. Skipping.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).sort();
    const { rows: runMigrations } = await client.query('SELECT name FROM _migrations');
    const runMigrationNames = new Set(runMigrations.map(m => m.name));

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      if (runMigrationNames.has(file)) {
        console.log(`ℹ️  Skipping migration: ${file} (already run)`);
        continue;
      }

      console.log(`🚀 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Migration successful: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Migration failed: ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }

    console.log('🎉 All migrations complete!');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
