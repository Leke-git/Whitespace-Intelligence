const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY secret is not set in GitHub Secrets.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Connected to Supabase API.');

    // Create migrations table if it doesn't exist via exec_sql
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          run_at TIMESTAMPTZ DEFAULT now()
        );
      `
    });

    const migrationsDir = path.join(__dirname, '../database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('ℹ️  No migrations directory found. Skipping.');
      return;
    }

    const files = fs.readdirSync(migrationsDir).sort();
    
    // Get run migrations
    const { data: runMigrations, error: fetchError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT name FROM _migrations'
    });

    if (fetchError) {
      console.error('❌ Error fetching migrations:', fetchError.message);
      process.exit(1);
    }

    const runMigrationNames = new Set((runMigrations || []).map(m => m.name));

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      if (runMigrationNames.has(file)) {
        console.log(`ℹ️  Skipping migration: ${file} (already run)`);
        continue;
      }

      console.log(`🚀 Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Run migration and record it
      const { error: runError } = await supabase.rpc('exec_sql', {
        sql: `
          BEGIN;
          ${sql}
          INSERT INTO _migrations (name) VALUES ('${file}');
          COMMIT;
        `
      });

      if (runError) {
        console.error(`❌ Migration failed: ${file}`);
        console.error(runError.message);
        process.exit(1);
      }

      console.log(`✅ Migration successful: ${file}`);
    }

    console.log('🎉 All migrations complete!');
  } catch (err) {
    console.error('❌ Migration process error:', err.message);
    process.exit(1);
  }
}

migrate();
