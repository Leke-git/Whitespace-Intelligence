# WHITESPACE — System Architecture

## Overview
WHITESPACE is a full-stack application built with Next.js, Supabase, and n8n. It serves as a coordination hub for NGOs in Nigeria.

## Services
- **Frontend**: Next.js (React) hosted on Vercel.
- **Database & Auth**: Supabase (PostgreSQL + GoTrue).
- **Automation**: n8n for complex multi-step workflows (AI scoring, notifications).
- **AI**: Gemini 3 Flash for gap intelligence and lead scoring.

## Data Flows
1. **NGO Registration**:
   - User submits form → `organisations` table (Supabase).
   - Admin verifies → `trust_tier` updated.
2. **Programme Logging**:
   - NGO submits programme → `programmes` table.
   - Webhook trigger → n8n → AI Analysis → Update `programmes` with impact score.
3. **Gap Analysis**:
   - Admin imports LGA data → `lgas` table.
   - Map component fetches `lgas` and `programmes` to calculate density vs. gap.

## Security
- **Row Level Security (RLS)**: Enforces that NGOs can only edit their own data.
- **Admin Token**: Access to `/admin` requires a secret `ADMIN_URL_TOKEN`.
- **Webhook Secret**: All communication between the app and n8n is signed with a `WEBHOOK_SECRET`.
