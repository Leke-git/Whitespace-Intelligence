# WHITESPACE — Automation Workflows

## Tool: n8n
All complex logic is routed through n8n to ensure auditability and flexibility.

## Workflows
### 1. Programme Impact Analysis
- **Trigger**: New entry in `programmes` table.
- **Steps**:
  1. Fetch LGA gap data.
  2. Send to Gemini Flash for scoring.
  3. Update `programmes` record with `impact_score`.
  4. Notify Admin if impact is high.

### 2. NGO Verification Alert
- **Trigger**: NGO trust tier change.
- **Steps**:
  1. Send welcome email to NGO.
  2. Update public registry cache.

## CI/CD Workflows (GitHub Actions)
### 1. n8n Sync
- **Trigger**: Push to `main` with changes in `n8n/`.
- **Action**: Automatically updates the n8n workflow in your instance.

### 2. Database Migration
- **Trigger**: Push to `main` with new `.sql` files in `database/migrations/`.
- **Action**: Automatically applies new SQL migrations to the Supabase database and tracks them in a `_migrations` table.
