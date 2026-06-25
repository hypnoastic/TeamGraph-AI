# TeamGraph AI

[![Project Health](https://github.com/yashkumar/TeamGraph-AI/actions/workflows/project-health.yml/badge.svg)](https://github.com/yashkumar/TeamGraph-AI/actions/workflows/project-health.yml)
[![Build & Deploy](https://github.com/yashkumar/TeamGraph-AI/actions/workflows/deploy.yml/badge.svg)](https://github.com/yashkumar/TeamGraph-AI/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](packages/teamgraph-mcp/LICENSE)

TeamGraph is a governed live organization brain. Graphiti provides temporal memory, Neo4j stores the knowledge graph, and TeamGraph adds Postgres-backed identity, permissions, approvals, API keys, and audit controls.

## Architecture

```text
Web app -> FastAPI -> TeamGraph safety/permission layer -> Graphiti -> Neo4j
MCP CLI -> FastAPI -> scoped API-key validation ---------> Graphiti -> Neo4j
                         |
                         +-> Postgres control plane
```

Graphiti is never exposed directly. If Graphiti or its LLM provider is unavailable, retrieval falls back to approved Postgres context and the app remains usable.

## Run locally

Requirements: Python 3.11+, Node 20+, Postgres, and either hosted Neo4j or the optional local container.

```bash
cp .env.example .env
docker compose up -d neo4j                 # optional when using hosted Neo4j

cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
DEMO_MODE=true python scripts/seed.py      # optional hackathon data
uvicorn main:app --reload --port 8000
```

```bash
cd apps/web
npm ci
npm run dev
```

```bash
cd packages/teamgraph-mcp
npm ci
npm run build
npm link
```

Open `http://localhost:3000`. With `DEMO_MODE=true`, use `admin@teamgraph.local`, `member@teamgraph.local`, or `demo@teamgraph.local`; password: `password`.

## Product flows

- Signup creates an account, then organization onboarding creates the first project.
- Context uploads are scanned and curated before ingestion.
- Safe context becomes a Graphiti episode immediately.
- Risky context waits for an admin; rejected or quarantined content never enters Graphiti.
- Brain Chat searches Graphiti first and returns citations, graph facts, confidence, and deterministic fallback answers.
- API keys are stored as hashes and validated for every MCP request.
- Members only see assigned projects and cannot approve context or manage the team.
- Connector cards are placeholders only. Slack, GitHub, Drive, Notion, Jira, Linear, Gmail, and Calendar are intentionally not connected.

## Environment

Required in production:

```text
DATABASE_URL
SECRET_KEY
FRONTEND_ORIGIN
PUBLIC_BASE_URL
NEO4J_URI
NEO4J_USERNAME
NEO4J_PASSWORD
NEO4J_DATABASE
```

Set `GEMINI_API_KEY` or `OPENAI_API_KEY` for live Graphiti. Without either, TeamGraph reports fallback mode.

## MCP

Create a key in **API Keys**, then:

```bash
teamgraph-mcp login --api-key tg_live_xxx --server-url http://localhost:8000
teamgraph-mcp status
teamgraph-mcp get-context --query "What changed?" --project "Core Platform"
teamgraph-mcp upload-context --file ./handoff.md --project "Core Platform"
teamgraph-mcp serve
```

See `packages/teamgraph-mcp/README.md` for MCP client configuration.

## Production / EC2

Production compose expects external Postgres and hosted Neo4j:

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Allow inbound HTTP/HTTPS, point DNS at the instance, update `deploy/nginx.conf`, and provision its certificate paths. The API container runs Alembic before startup.

## Quality & Testing

TeamGraph uses automated project health reporting to ensure code quality, security, and reliability across all components.

```bash
make health         # Generate full health report (MD + JSON + HTML)
make test           # Run API tests
make test:coverage  # Coverage report
make lint           # Lint all components
make build          # Build web + MCP
make security       # Security audits
```

Reports are generated to `reports/latest/`. See [docs/testing-matrix.md](docs/testing-matrix.md) for the full testing methodology.

## Verify

```bash
python3 -m compileall -q apps/api
cd apps/web && npm run lint && npm run build
cd packages/teamgraph-mcp && npm run build && npm pack --dry-run
```

Known limitation: Graphiti provider compatibility can vary by `graphiti-core` release; all live calls are isolated behind the service wrapper and degrade to approved-context search.
