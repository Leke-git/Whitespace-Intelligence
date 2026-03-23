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

    // Check if exec_sql RPC exists
    const { error: rpcCheckError } = await supabase.rpc('exec_sql', {
      sql: 'SELECT 1'
    });

    if (rpcCheckError && rpcCheckError.message.includes('function rpc(exec_sql) does not exist')) {
      console.error('❌ ERROR: The "exec_sql" RPC function is not defined in your Supabase project.');
      console.error('👉 Please run the following SQL in your Supabase SQL Editor first:');
      console.error(`
        CREATE OR REPLACE FUNCTION exec_sql(sql text)
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER
        AS $$ BEGIN EXECUTE sql; END; $$;
      `);
      process.exit(1);
    }

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
    const { data: runMigrations, error: fetchError } = await supabase
      .from('_migrations')
      .select('name');

    if (fetchError && !fetchError.message.includes('relation "_migrations" does not exist')) {
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
          ${sql}
          INSERT INTO _migrations (name) VALUES ('${file}');
        `
      });

      if (runError) {
        console.error(`❌ Migration failed: ${file}`);
        console.error('Error details:', runError);
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
