# WHITESPACE — Changelog

## v1.2.0 — 2026-03-19
- **Infrastructure**: Added robust automatic database migration pipeline via GitHub Actions.
- **CI/CD**: Implemented `_migrations` table tracking to ensure migrations only run once.
- **Organization**: Consolidated all database assets into the `/database` folder, including a new `/database/migrations` directory.
- **Documentation**: Updated Setup Guide and Automation docs with the new migration workflow.

## v1.1.0 — 2026-03-19
- **Infrastructure**: Added n8n sync pipeline and GitHub Actions.
- **Documentation**: Initialized PRD, Design System, and Architecture docs.
- **Database**: Added schema versioning and dummy data management.
- **Security**: Implemented admin URL token requirement and environment variable standards.
- **NGO Dashboard**: Enhanced "Proof of Work" management tools.

## v1.0.0 — 2026-03-18
- Initial build: NGO Coordination Map & Registry.
- Stack: Next.js, Supabase, Lucide Icons.
