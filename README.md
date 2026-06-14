# TeamGraph AI

TeamGraph AI is a Graphiti-powered organization brain. Graphiti and Neo4j handle memory; TeamGraph wraps them with Postgres-backed auth, permissions, approvals, API keys, connector control, MCP access, and a hackathon-ready web product.

## Architecture

```txt
User / Admin
  -> Next.js Web App
  -> FastAPI Backend
  -> TeamGraph permission + safety layer
  -> Graphiti service wrapper
  -> Neo4j

External Agent
  -> @teamgraph/mcp CLI
  -> TeamGraph FastAPI backend
  -> Postgres-backed API key validation
  -> Graphiti search / episode ingestion
  -> Neo4j
```

Postgres is the control-plane database. Graphiti + Neo4j stay focused on knowledge and retrieval.

## What Works

- Landing page and upgraded auth UI
- Real signup/login backed by Postgres
- Seeded demo accounts and seeded demo knowledge
- Brain Chat
- Context upload and inbox
- Approval queue
- Postgres-backed API keys
- `@teamgraph/mcp` CLI and MCP server
- Graph visualization with Graphiti-oriented memory styling
- Team and activity views
- Connector control surface for GitHub, Slack, and Google Drive
- Local Neo4j Docker workflow
- Production Docker packaging for EC2

## Demo Accounts

- `admin@teamgraph.local` / `password`
- `member@teamgraph.local` / `password`
- `demo@teamgraph.local` / `password`

The `demo@teamgraph.local` account is seeded with dummy launch, connector, and deployment knowledge for hackathon demos.

## Local Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`. Use your Neon connection string there.
2. Start Neo4j.

```bash
docker compose up -d neo4j
```

3. Seed Postgres and Neo4j.

```bash
cd apps/api
python3 scripts/seed.py
```

4. Start the backend.

```bash
cd apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

5. Start the frontend.

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

## AWS EC2 Deployment

Use the production compose stack on a single EC2 host:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Production packaging added in this repo:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `deploy/nginx.conf`
- `docker-compose.prod.yml`

Expected production env vars:

- `DATABASE_URL`
- `PUBLIC_BASE_URL`
- `API_BASE_URL`
- `FRONTEND_ORIGIN`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- Graphiti provider env vars
- GitHub / Slack / Google connector credentials

## Auth and API Key Flow

- Signup/login is stored in Postgres.
- Session tokens are bearer tokens backed by Postgres session records.
- API keys are hashed before storage and validated from Postgres on MCP calls.
- Demo shortcuts log into seeded Postgres users, not hardcoded mock tokens.

## Brain Chat Flow

1. User signs in.
2. TeamGraph validates project access from Postgres.
3. Graphiti search runs first.
4. TeamGraph enriches results with metadata and citations.
5. Gemini answers if configured; deterministic fallback answers otherwise.

## Context Upload and Approval Flow

1. UI or CLI uploads context.
2. TeamGraph stores raw metadata.
3. Safety checks run before ingestion.
4. Safe content is linked to Graphiti memory.
5. Risky content goes to approvals.
6. Unsafe content is quarantined.

## Connectors

Current connector state:

- GitHub: real install/start URL support and persisted connection state
- Slack: real OAuth start URL support and persisted connection state
- Google Drive: real OAuth start URL support and persisted connection state
- Notion, Jira, Teams, Outlook: still clearly marked as coming soon

Important: without real provider credentials in `.env`, live provider verification cannot complete. The product surface is wired for them, but final live OAuth/install testing depends on those credentials.

## CLI Commands

```bash
teamgraph-mcp login --api-key <key> --server-url http://localhost:8000
teamgraph-mcp status
teamgraph-mcp serve
teamgraph-mcp get-context --query "What does the demo brain know?"
teamgraph-mcp upload-context --text "Decision: approvals gate risky memory." --project "Core Platform"
teamgraph-mcp upload-context --file ./context.md --project "Core Platform"
teamgraph-mcp list-context-sources
teamgraph-mcp optimize-graph
```

## Known Limitations

- GitHub, Slack, and Google Drive need real app credentials before end-to-end live OAuth/install testing can be completed.
- Graphiti live behavior still depends on your configured provider and local Neo4j availability.
- Approval metadata is still primarily modeled in the graph path and has not been fully normalized into Postgres tables.
- The current auth model uses bearer session tokens rather than cookie sessions.

See `CONTEXT.md` for the implementation handoff and current repo status.
