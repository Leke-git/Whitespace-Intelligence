# Whitespace — Setup Guide

This guide will take you from zero to a fully functional coordination intelligence platform for Nigeria.

## 1. Prerequisites
- A **Supabase** account (for the database and authentication).
- A **Google AI Studio** API key (for Gemini 1.5 Flash).
- A self-hosted **n8n** instance (for the automation layer).

## 2. Supabase Setup
1. Create a new project in Supabase.
2. Go to the **SQL Editor** and paste the contents of `schema.sql`. Run the script to create the tables and RLS policies.
3. Go to **Project Settings -> API** and copy your `URL` and `anon public` key.
4. Add these to your environment variables (see `.env.example`).

## 3. n8n Setup
1. Import the `n8n/workflow.json` file into your n8n instance.
2. Create a **Set Node** named "Secrets" and add the following:
   - `supabaseUrl`: Your Supabase Project URL.
   - `supabaseServiceKey`: Your Supabase **service_role** key (found in Project Settings -> API).
   - `geminiApiKey`: Your Google AI Studio API key.
   - `webhookSecret`: A random string of your choice (must match the one in your app).
3. Activate the workflow.

## 4. How to Replace Proxy Data with Real Data
The app starts with "Proxy Data" for the 774 LGAs. To replace this with real institutional data:
1. Log in to the **Admin Dashboard** (at `/admin`).
2. Navigate to the **Data Import** tab.
3. Upload a CSV file with the following columns:
   - `lga_id`: The ID of the LGA (1 to 774).
   - `need_index`: A decimal between `0.0` and `1.0`.
4. The platform will automatically update the maps and gap analysis alerts.

## 5. Deploying the Frontend
1. Push this repository to GitHub.
2. Connect the repository to **Vercel** or **Netlify**.
3. Add the following environment variables to your deployment platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_URL_TOKEN`: A secret string used to protect the admin dashboard.
   - `WEBHOOK_SECRET`: The same secret you used in n8n.

## 6. GitHub Secrets
To enable automatic n8n workflow syncing, add these to your GitHub Repo Secrets:
- `N8N_BASE_URL`: The URL of your n8n instance.
- `N8N_API_KEY`: Your n8n API key (Settings -> API).

---
*For more detailed technical information, see the `docs/` folder.*
