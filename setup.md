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
3. Add the following environment variables to your deployment platform (these are separate from GitHub Secrets):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ADMIN_URL_TOKEN`: A secret string of your choice (e.g., `my-super-secret-123`). This protects your admin dashboard.
   - `WEBHOOK_SECRET`: The same secret you used in n8n.

### How to Access the Admin Dashboard
The Admin Dashboard is protected by the `ADMIN_URL_TOKEN`. To access it, you must append the token to the URL as a query parameter:

**URL Format:** `https://your-app.run.app/admin?token=YOUR_ADMIN_URL_TOKEN`

**Example:**
If your `ADMIN_URL_TOKEN` is `coordination-2026`, you would visit:
`https://ais-dev-f4ur7zgl76n47zxd7tx7qk-160279474191.europe-west2.run.app/admin?token=coordination-2026`

If you try to access `/admin` without the correct token, you will be automatically redirected back to the home page.

> [!NOTE]
> **Vercel/Netlify vs. GitHub Secrets:** Environment variables in Vercel/Netlify are used by the **app itself** when it runs. GitHub Secrets are used by **GitHub Actions** (like the n8n sync) when you push code.

## 6. GitHub Secrets Setup (Optional)

If you want to automatically sync your local `n8n/workflow.json` changes to your live n8n instance whenever you push to GitHub, follow these steps:

### Step 1: Navigate to GitHub Secrets
1. Open your repository on **GitHub**.
2. Click on the **Settings** tab at the top.
3. In the left sidebar, click on **Secrets and variables** -> **Actions**.
4. Click the green **New repository secret** button.

### Step 2: Add the Required Secrets
Add the following two secrets one by one:

| Secret Name | What it is | Where to find it |
| :--- | :--- | :--- |
| `N8N_BASE_URL` | Your n8n instance URL | e.g., `https://n8n.yourdomain.com` |
| `N8N_API_KEY` | Your n8n API Key | In n8n: **Settings** -> **API** -> **Create API Key** |

> [!TIP]
> **Troubleshooting:** Make sure your `N8N_BASE_URL` does **not** have a trailing slash (e.g., use `https://n8n.com`, not `https://n8n.com/`). If the sync fails, check the **Actions** tab in GitHub for the error log.

### Why do this?
Once these are set, the included GitHub Action (`.github/workflows/n8n-sync.yml`) will automatically update your n8n workflow every time you push code to the `main` branch. This keeps your automation logic in sync with your frontend code.

---
*For more detailed technical information, see the `docs/` folder.*
