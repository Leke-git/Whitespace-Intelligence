# WHITESPACE — NGO Coordination & Gap Intelligence
Version 1.0 | 2026-03-23
Status: Confirmed

## 1. PROBLEM STATEMENT
Humanitarian aid in Nigeria often suffers from service duplication in some areas while others remain critically underserved. NGOs lack a centralized, real-time coordination tool to map their activities against actual needs data, leading to inefficient resource allocation and gaps in life-saving services.

## 2. SOLUTION OVERVIEW
WHITESPACE is a coordination and intelligence platform that maps NGO activity density against LGA-level gap scores. It uses AI to analyze programme data, identify coordination opportunities, and provide strategic recommendations to donors and partners, ensuring aid reaches the most underserved areas.

## 3. USERS & ROLES
- **NGO Representative**:
  - WHO: Staff of local or international NGOs operating in Nigeria.
  - CAN DO: Register organization, log programmes, manage "Proof of Work" profile.
  - CAN SEE: Coordination map, gap intelligence, other NGO profiles.
  - DEVICE: Responsive (Mobile for field updates, Desktop for profile management).
- **Donor / Partner**:
  - WHO: Funding agencies, government bodies, or strategic partners.
  - CAN DO: Browse registry, identify high-impact partners, view gap analytics.
  - CAN SEE: All public NGO data and coordination maps.
  - DEVICE: Desktop-first.
- **Platform Admin (App Owner)**:
  - WHO: The WHITESPACE team managing the platform.
  - CAN DO: Verify NGOs, manage global gap data, monitor platform health.
  - CAN SEE: All data, audit logs, and metrics.
  - DEVICE: Desktop (Admin Panel).

## 4. ARCHITECTURE
- **APP TYPE**: Multi-role platform with public and authenticated views.
- **AUTH MODEL**: Supabase Auth (Google Login).
- **PAGE STRUCTURE**:
  - `/` — Landing Page (Public)
  - `/registry` — NGO Directory (Public)
  - `/map` — Coordination Map (Public/Auth)
  - `/intelligence` — Gap Analysis (Auth)
  - `/dashboard` — NGO Workspace (Auth)
  - `/admin` — Owner Dashboard (Protected)

## 5. TECH STACK
- **AI MODEL**: Gemini 3 Flash — Intelligent gap analysis and recommendation engine.
- **DATABASE**: Supabase (PostgreSQL) — Real-time data and RLS.
- **AUTOMATION**: n8n — Complex logic, AI processing, and notifications.
- **DEPLOYMENT**: Vercel — Frontend hosting.

## 6. FEATURES — MVP SCOPE
- **Coordination Map (P0)**: Interactive map visualizing NGO activity vs. LGA gap scores.
- **NGO Registry (P0)**: Searchable directory of verified NGOs with "Proof of Work" pages.
- **Gap Intelligence (P0)**: AI-driven analysis of service coverage and underserved areas.
- **NGO Dashboard (P0)**: Profile management, programme logging, and resource uploads.
- **Owner Dashboard (P0)**: Verification queue, global settings, and data management.

## 7. DATA MODEL
- `organisations`: NGO identity, CAC details, trust tier, and branding.
- `programmes`: Activity details, sector, budget, and beneficiary reach.
- `lga_gap_scores`: 774 LGAs with computed gap scores based on need vs. coverage.
- `sectors`: Humanitarian and development sectors (Health, Education, WASH, etc.).
- `site_settings`: Global configuration for the platform.

## 8. AUTOMATIONS
- `process-gap-analysis`: Triggered on new programme entry; uses Gemini to score impact and identify redundancy.
- `new-ngo-registration`: Alerts Admin for verification on new NGO sign-ups.
- `sync-ngo-data`: Periodic sync with external coordination datasets.

## 9. DESIGN DIRECTION
- **VISUAL TONE**: Professional, trustworthy, and data-driven.
- **COLOR PALETTE**: Emerald green (growth/aid), Slate gray (professionalism), and Ruby red (critical gaps).
- **TYPOGRAPHY**: Inter for UI, Space Grotesk for headings.

## 10. SECURITY DESIGN
- **RLS**: Strict Row Level Security in Supabase ensures NGOs only manage their own data.
- **Security Gate**: n8n webhooks are protected by a `webhookSecret` validation.
- **Admin Protection**: The owner dashboard is protected by a unique URL token and JWT.
