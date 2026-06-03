# ClearPass Deployment Topology

Updated: 2026-06-02

## Primary Production Path

Use Railway as the primary production topology.

| Component | Primary target | Notes |
|---|---|---|
| Main app | Railway service from repo root | `railway.toml` builds the client and starts the Node server. |
| Database | Railway MySQL | Use Railway reference variables or `DATABASE_URL`. |
| AI service | Separate Railway service rooted at `ai_service/` | Service listens on port `5001`; use Railway private networking when available. |
| Frontend | Served by the Node server in production | Avoid separate frontend hosting unless CORS and cookie behavior are revalidated. |

Required production env vars for the main app:

```env
NODE_ENV=production
PORT=3002
DB_HOST=<railway mysql host>
DB_PORT=<railway mysql port>
DB_USER=<railway mysql user>
DB_PASSWORD=<railway mysql password>
DB_NAME=<railway mysql database>
JWT_SECRET=<random string, at least 32 characters>
JWT_EXPIRES_IN=8h
MFA_PENDING_JWT_EXPIRES_IN=15m
MFA_ENFORCE_VERIFICATION=true
FRONTEND_URL=<public app origin>
FRONTEND_URLS=<public app origin>
ALLOW_NO_ORIGIN_REQUESTS=false
AI_SERVICE_URL=<railway private ai service url>
AI_SERVICE_ENABLED=true
```

## Local And Self-Hosted Path

Use `docker-compose.yml` for local or VPS-style validation once Docker is installed. The compose file now wires required server env vars, aligns `AI_SERVICE_URL` to the AI service port, and uses the AI service Python healthcheck instead of `curl`.

Docker verification is still pending on this workstation because `docker` is not installed or not available on `PATH`.

## Secondary Paths

The following paths are secondary and must not be treated as the default production route without a fresh runtime validation:

- `DEPLOYMENT_GUIDE.md`: Netlify + Vercel + Railway split deployment.
- `vercel.json`: Vercel/serverless configuration.
- `netlify.toml`: Netlify frontend configuration.
- `ecosystem.config.cjs`: PM2 process configuration.

## Clean Clone Deployment Steps

1. Install Node 24.x and npm 11.x from `.nvmrc` and `package.json` engines.
2. Run `npm ci`, `npm ci --prefix client`, `npm ci --prefix server`, and `npm ci --prefix tests`.
3. Create production env vars from `.env.example`; do not reuse local placeholder secrets.
4. Run `npm run lint`, `npm test`, and `npm run build:client`.
5. Provision Railway MySQL.
6. Deploy the AI service from `ai_service/` and confirm `/health`.
7. Set `AI_SERVICE_URL` on the main Railway service.
8. Deploy the main app from repo root.
9. Run `npm run db:migrate` against the production database.
10. Verify `/health`, login, MFA, document request, certificate request, and AI route smoke tests.
