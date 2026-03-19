# WHITESPACE — Setup Guide

## Prerequisites
- Node.js 20+
- Supabase Account
- GitHub Account
- n8n Instance (Self-hosted or Cloud)

## Step 1 — Database Setup
1. Create a new project in Supabase.
2. (Optional) Run `database/dummy_data.sql` to seed the database.
3. **Automatic Migrations:** Add `SUPABASE_DB_URL` to your GitHub repository secrets (Format: `postgres://[user]:[password]@[host]:[port]/[db]`). On every push to `main`, any new `.sql` files added to the `database/migrations/` folder will be automatically applied to your Supabase database.

## Step 2 — Environment Variables
1. Copy `.env.example` to `.env`.
2. Fill in your Supabase URL and Anon Key.
3. Set a `WEBHOOK_SECRET` and `ADMIN_URL_TOKEN`.

## Step 3 — n8n Integration
1. In n8n, create a new workflow and import `n8n/workflow.json`.
2. Set up your credentials in the "Secrets" node.
3. Add `N8N_BASE_URL` and `N8N_API_KEY` to your GitHub repository secrets.

## Step 4 — Deployment
1. Connect your GitHub repo to Vercel.
2. Add all environment variables from `.env` to Vercel.
3. Deploy!
