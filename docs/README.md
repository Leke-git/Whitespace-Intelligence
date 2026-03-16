# Whitespace — Documentation

## Architecture
Whitespace is built as a coordination intelligence platform.
- **Frontend**: Next.js 14+ (App Router) for the UI.
- **Database**: Supabase (PostgreSQL) for relational data and RLS.
- **Intelligence**: Gemini 1.5 Flash via n8n for gap analysis.
- **Maps**: MapLibre GL for high-performance LGA visualization.

## Data Model
- `organizations`: Verified NGO profiles.
- `interventions`: Logged activities (Sector, LGA, Budget).
- `lga_data`: 774 LGAs with Need Index scores.

## Coordination Logic
The platform identifies "Gaps" by comparing the `need_index` of an LGA with the number of active `interventions` in that LGA for a specific sector.

## Security
- **RLS**: Row Level Security ensures NGOs can only edit their own data.
- **Admin Token**: The admin dashboard is protected by a secret URL token.
- **Webhook Secret**: All incoming data from the frontend to n8n is signed with a secret.
