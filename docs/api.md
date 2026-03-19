# WHITESPACE — API Reference

## Public Endpoints
### GET /api/config
Returns public configuration (e.g. webhook URLs).
**Auth**: None

## Admin Endpoints
### GET /api/admin-config
Returns sensitive admin configuration.
**Auth**: Requires `ADMIN_URL_TOKEN` in query string.

### POST /api/admin-login
Authenticates admin users.
**Auth**: Email/Password.

## Webhooks
### POST /api/v1/whitespace-enquiry
Triggered by form submissions.
**Payload**:
```json
{
  "intent": "programme_analysis",
  "webhookSecret": "...",
  "data": { ... }
}
```
