# WHITESPACE — NGO Coordination & Gap Intelligence
Version 1.0

## One-Line Purpose
A platform to map NGO activities against real-time gap data to eliminate service duplication and ensure aid reaches the most underserved areas.

## Users & Roles
- **NGO Representative**: Registers their organisation, logs programmes, and manages their "Proof of Work" landing page.
- **Donor / Partner**: Browses the registry and coordination map to identify high-impact partners.
- **Platform Admin**: Verifies NGOs, manages global gap data, and monitors platform health.

## Core Features
- **Coordination Map**: Visualises NGO activity density vs. LGA-level gap scores.
- **NGO Registry**: A searchable directory of verified NGOs with detailed "Proof of Work" pages.
- **Gap Intelligence**: AI-driven analysis of service coverage and underserved areas.
- **NGO Dashboard**: Tools for NGOs to manage their public profile, gallery, and resources.
- **Admin Dashboard**: Verification queue and data import tools.

## Data Model
- `organisations`: Legal name, CAC number, trust tier, branding.
- `programmes`: Activity title, sector, budget, reach, dates.
- `lgas`: 774 Local Government Areas with gap scores.
- `organisation_gallery`: Visual proof of work.
- `organisation_resources`: Reports and financial statements.
