# WHITESPACE — Automation Workflows

## Tool: n8n
All complex logic is routed through n8n to ensure auditability, flexibility, and scalability.

## Workflow Structure
The `n8n/workflow.json` follows a standardized production structure:
1. **Webhook Trigger**: Entry point for all external events.
2. **Secrets Node**: Centralized management of API keys and credentials.
3. **Security Gate**: Validates the `webhookSecret` to prevent unauthorized access.
4. **Intent Router**: A switch node that routes requests based on the `intent` field.

## Intent Branches
### 1. `process-gap-analysis`
- **Purpose**: Analyzes NGO programme data against LGA gap scores using AI.
- **Steps**:
  1. Fetch programme and LGA gap data from Supabase.
  2. Call Gemini 3 Flash with the data and system prompt.
  3. Update the `programmes` record with AI-generated impact scores and recommendations.
  4. Notify Admin if the programme is identified as redundant or high-priority.

### 2. `new-ngo-registration`
- **Purpose**: Handles new NGO registrations and verification alerts.
- **Steps**:
  1. Fetch NGO details from Supabase.
  2. Send a notification to the Platform Admin (e.g., via Slack or Email).
  3. Trigger a verification queue entry.

### 3. `sync-ngo-data`
- **Purpose**: Synchronizes NGO data with external coordination systems (e.g., OCHA 3W).
- **Steps**:
  1. Fetch NGO and programme data.
  2. Format for external API.
  3. Push to external service.

## CI/CD Workflows (GitHub Actions)
### 1. n8n Sync (`.github/workflows/sync-to-n8n.yml`)
- **Trigger**: Push to `main` with changes in `n8n/`.
- **Action**: Automatically updates the n8n workflow in your instance via the n8n REST API.

### 2. Database Migration (`.github/workflows/run-migrations.yml`)
- **Trigger**: Push to `main` with new `.sql` files in `database/migrations/`.
- **Action**: Automatically applies new SQL migrations to the Supabase database.
