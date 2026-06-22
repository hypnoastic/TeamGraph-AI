# TeamGraph AI Context

## Status

As of June 22, 2026, TeamGraph has a Postgres control plane and a Graphiti/Neo4j knowledge plane. The web app, API, and MCP package build successfully.

## Implemented

- Signup/login/logout with hashed sessions.
- Organization onboarding, projects, member invitations, roles, and project access.
- Postgres records for raw uploads, approvals, trusted context, activity, and hashed API keys.
- Safety-first upload flow with Graphiti episode ingestion after approval only.
- Graphiti wrapper with Gemini/OpenAI-compatible selection and deterministic fallback.
- Normalized graph visualization independent of Graphiti internals.
- Brain Chat, dashboard, context upload, approvals, team, keys, MCP setup, activity, settings, and connector placeholders.
- Minimal neo-brutalist design system from `DESIGN.md` and Stitch project `9754775499334833171`.
- Hosted Neo4j support through `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, and `NEO4J_DATABASE`.
- Alembic migration and external-database production compose.
- Publish-ready `@teamgraph/mcp` package.

## Main files

- Graphiti: `apps/api/services/graphiti/`
- Upload/approval flow: `apps/api/services/context_service.py`
- Auth and organizations: `apps/api/routers/auth.py`, `organizations.py`, `team.py`, `projects.py`
- Data model/migration: `apps/api/models.py`, `apps/api/alembic/`
- Web design: `DESIGN.md`, `apps/web/src/app/globals.css`
- App shell/routes: `apps/web/src/app/dashboard/`
- MCP: `packages/teamgraph-mcp/`
- Deployment: `docker-compose.prod.yml`, `deploy/nginx.conf`

## Run

```bash
docker compose up -d neo4j
cd apps/api && source .venv/bin/activate && alembic upgrade head && uvicorn main:app --reload --port 8000
cd apps/web && npm run dev
cd packages/teamgraph-mcp && npm run build && npm link
```

Set `DEMO_MODE=true` and run `python apps/api/scripts/seed.py` for hackathon accounts and dummy knowledge.

## Known issues

- External connectors are placeholders by design.
- Live Graphiti requires a supported provider key and reachable Neo4j; fallback mode remains functional without them.
- The included nginx certificate/server name is deployment-specific and must match the final host.

## Next steps

- Add provider-specific connectors only after OAuth credentials and callback domains are finalized.
- Add CI against disposable Postgres and Neo4j services.
- Publish `@teamgraph/mcp` after choosing the final npm organization and repository URL.
