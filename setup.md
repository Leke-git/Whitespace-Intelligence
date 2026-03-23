# WHITESPACE — Setup Guide

## What You Are Setting Up
WHITESPACE is a production-ready NGO coordination platform. You are setting up a full-stack environment including:
- **Supabase**: Database, Authentication, and Real-time API.
- **n8n**: Automation engine for intelligent gap analysis and notifications.
- **GitHub Actions**: Automated CI/CD for database migrations and n8n workflow syncing.
- **Vercel**: Frontend hosting.

## Prerequisites
- **Supabase Account**: [supabase.com](https://supabase.com)
- **n8n Instance**: [n8n.io](https://n8n.io) (Self-hosted or Cloud)
- **GitHub Account**: For CI/CD and version control.
- **Gemini API Key**: [aistudio.google.com](https://aistudio.google.com)

## Step 1 — Database Setup
1. Create a new project in Supabase.

### Pre-Migration Setup
**MANDATORY:** You must first run the following SQL in your Supabase SQL Editor to enable the migration script:
```sql
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
AS $$ BEGIN EXECUTE sql; END; $$;
```
This function allows the automated script to run migrations securely.

2. Open the **SQL Editor** and run `database/schema.sql`.
3. (Optional) Run `database/dummy_data.sql` to seed the database for testing.
4. **Automatic Migrations:** Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to your GitHub repository secrets. On every push to `main`, any new `.sql` files added to the `database/migrations/` folder will be automatically applied via the `run-migrations.yml` workflow.

## Step 2 — Environment Variables
1. Copy `.env.example` to `.env`.
2. Fill in your Supabase URL and Anon Key.
3. Set a `WEBHOOK_SECRET` (e.g., `openssl rand -hex 32`) and `ADMIN_URL_TOKEN` (e.g., `openssl rand -hex 16`).
4. Set `GEMINI_API_KEY` for AI features.

## Step 3 — n8n Integration
1. In n8n, create a new workflow and import `n8n/workflow.json`.
2. Open the **Secrets** node and enter your credentials:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GEMINI_API_KEY`
   - `WEBHOOK_SECRET` (must match Step 2)
3. Add `N8N_BASE_URL` and `N8N_API_KEY` to your GitHub repository secrets.
4. **Workflow ID Sync:** 
   - When you first push to GitHub, the `sync-to-n8n.yml` workflow will create the workflow in n8n.
   - Check the **Actions** tab in GitHub. The log for "Sync workflows to n8n" will contain a message like: `✅ Created! New ID: 123`.
   - **IMPORTANT:** Add `"id": "123"` to your `n8n/workflow.json` file and push again. This ensures future changes to the file will *update* the existing workflow instead of creating a new one.
5. Activate the workflow in n8n.

## Step 4 — Code Review Gate Setup
To ensure high code quality and security, a pre-deployment code review gate is integrated into the CI/CD pipeline.

1. **Disable Vercel Automatic Deploys:**
   - In your Vercel project settings, go to **Git**.
   - Under **GitHub**, find the **Automatic Deployments** section and disable it. This prevents Vercel from deploying before the code review is complete.
2. **Add GitHub Secrets:**
   - Go to your GitHub repository **Settings** -> **Secrets and variables** -> **Actions**.
   - Add the following secrets:
     - `ANTHROPIC_API_KEY`: Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com).
     - `VERCEL_TOKEN`: A Vercel Personal Access Token from [vercel.com/account/tokens](https://vercel.com/account/tokens).
     - `VERCEL_ORG_ID`: Your Vercel Organization ID (found in your Vercel team settings).
     - `VERCEL_PROJECT_ID`: Your Vercel Project ID (found in your Vercel project settings).
3. **Interpreting Review Reports:**
   - On every push to `main`, the `Code Review & Deploy` workflow runs.
   - A detailed report is posted as a **commit comment** on GitHub.
   - The report scores your changes across five dimensions: Security, Maintainability, Redundancy, Simplicity, and Documentation.
   - **Failure:** If any dimension scores below 6/10, the review fails, and the deployment to Vercel is blocked.
   - **Action:** Read the "Findings" in the commit comment, address the issues in a new commit, and push again to trigger a new review.

## Step 5 — Deployment
1. Connect your GitHub repo to Vercel (if not already done).
2. Add all environment variables from `.env` to Vercel.
3. Push to `main` to trigger the first code review and deployment!

## Step 5 — Verify Everything Works
- □ App loads at deployment URL.
- □ NGO Registry shows seeded data.
- □ Coordination Map visualizes LGA gap scores.
- □ Intelligence page displays AI-driven analyses.
- □ Admin dashboard login works at `/admin?token=[ADMIN_URL_TOKEN]`.

## Step 6 — Going Live
1. Log into the **Owner Dashboard**.
2. Go to **Data Management**.
3. Click **Wipe Demo Data** and type `CONFIRM`.
4. Your platform is now clean and ready for real users.

## Adding Features After Launch
To add a feature, return to this session and describe it. I will update the PRD, generate code changes, and handle migrations. Push to GitHub, and the pipelines will handle the rest.
