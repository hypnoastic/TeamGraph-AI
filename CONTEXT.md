# CONTEXT.md

## Current Status

- Date: June 14, 2026
- State: TeamGraph now uses Postgres for auth and control-plane data while keeping Graphiti + Neo4j for the knowledge plane.
- Demo path: `demo@teamgraph.local` is seeded automatically with dummy launch knowledge for hackathon submission flows.

## What Changed In This Pass

- Added a Postgres control-plane layer with SQLAlchemy models for users, sessions, API keys, connector accounts, and activity events.
- Replaced demo-token auth with real signup/login backed by Postgres session records.
- Kept demo shortcuts, but they now log into seeded Postgres users.
- Added automatic Neo4j bootstrap and seeded demo knowledge so the graph and Brain Chat have content immediately.
- Moved API-key validation and activity logging to Postgres-backed records.
- Added connector status persistence plus start/sync/disconnect routes for GitHub, Slack, and Google Drive.
- Standardized the dashboard shell with a constant top bar, consistent page headers, and a Graphiti-oriented graph UI.
- Added Dockerfiles, nginx config, and `docker-compose.prod.yml` for single-EC2 deployment.

## Files Modified Or Added

### Backend

- `apps/api/config.py`
- `apps/api/main.py`
- `apps/api/models.py`
- `apps/api/postgres.py`
- `apps/api/requirements.txt`
- `apps/api/auth/demo_auth.py`
- `apps/api/routers/auth.py`
- `apps/api/routers/api_keys.py`
- `apps/api/routers/connectors.py`
- `apps/api/routers/health.py`
- `apps/api/routers/mcp.py`
- `apps/api/routers/settings.py`
- `apps/api/scripts/seed.py`
- `apps/api/services/activity_service.py`
- `apps/api/services/bootstrap_service.py`
- `apps/api/services/team_service.py`
- `apps/api/services/postgres_seed.py`
- `apps/api/services/connectors/base.py`
- `apps/api/services/connectors/registry.py`
- `apps/api/services/graph_visualization_service.py`

### Frontend

- `apps/web/src/app/dashboard/layout.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/dashboard/brain/page.tsx`
- `apps/web/src/app/dashboard/context/page.tsx`
- `apps/web/src/app/dashboard/approvals/page.tsx`
- `apps/web/src/app/dashboard/api-keys/page.tsx`
- `apps/web/src/app/dashboard/connectors/page.tsx`
- `apps/web/src/app/dashboard/activity/page.tsx`
- `apps/web/src/app/dashboard/team/page.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`
- `apps/web/src/app/dashboard/graph/page.tsx`
- `apps/web/src/components/page-shell.tsx`
- `apps/web/src/lib/types.ts`
- `apps/web/next.config.ts`

### Deployment / Docs

- `.env.example`
- `.dockerignore`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `deploy/nginx.conf`
- `docker-compose.prod.yml`
- `README.md`
- `CONTEXT.md`

## How The App Runs Now

### Control plane

- Postgres stores:
  - users
  - sessions
  - API keys
  - activity events
  - connector account state
  - project access mappings

### Knowledge plane

- Graphiti + Neo4j store:
  - memory episodes
  - trusted graph context
  - graph visualization structure
  - fallback brain-search content

## How To Run Locally

1. Put your Postgres URL in `.env` as `DATABASE_URL`.
2. Start Neo4j.

```bash
docker compose up -d neo4j
```

3. Seed the app.

```bash
cd apps/api
python3 scripts/seed.py
```

4. Run the backend.

```bash
cd apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

5. Run the frontend.

```bash
cd apps/web
npm run dev
```

6. Build and link the CLI.

```bash
cd packages/teamgraph-mcp
npm run build
npm link
```

## How To Deploy To EC2

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

This stack expects:

- Neon or other Postgres reachable through `DATABASE_URL`
- Neo4j reachable from the compose stack
- production `PUBLIC_BASE_URL` and `API_BASE_URL`
- connector credentials for GitHub / Slack / Google Drive if live OAuth/install verification is needed

## Verification Run In This Session

- Backend syntax checks via `python3 -m py_compile ...`
- Backend import sanity via `venv/bin/python` importing `main`
- Frontend production build via `cd apps/web && npm run build`

## Known Issues

- Live GitHub, Slack, and Google Drive end-to-end verification is blocked until real provider credentials are supplied.
- The connector callback handlers currently persist connection state, but they do not yet exchange provider auth codes for durable tokens.
- Some review/approval metadata is still graph-modeled and has not been fully normalized into Postgres tables.
- Default no-env fallback uses `/tmp/teamgraph.db` if `DATABASE_URL` is not supplied; real usage should always point at Postgres.

## Next Steps

- Finish provider-specific token exchange and webhook/event ingestion for GitHub, Slack, and Google Drive.
- Move remaining control-plane approval metadata fully into Postgres.
- Add backend tests for signup/login, session validation, Postgres API-key validation, and connector status transitions.
- Smoke-test the production compose stack on a real EC2 host with callback URLs and provider credentials configured.
