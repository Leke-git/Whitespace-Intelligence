# WHITESPACE — Data Model

## organisations
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary Key |
| legal_name | TEXT | Official NGO name |
| slug | TEXT | URL-friendly name |
| trust_tier | ENUM | registered, verified, premium |
| dummy_data | BOOL | Sentinel for demo data |

## programmes
| Field | Type | Description |
|---|---|---|
| id | UUID | Primary Key |
| organisation_id | UUID | FK to organisations |
| beneficiary_count | INT | Estimated reach |
| gap_impact_score | DECIMAL | AI-generated score |

## lgas
| Field | Type | Description |
|---|---|---|
| id | SERIAL | Primary Key |
| name | TEXT | LGA Name |
| gap_score | DECIMAL | 0.0 (low need) to 1.0 (high need) |
