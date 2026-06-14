# TeamGraph AI

TeamGraph AI is a local-first organization brain. The product wraps Graphiti as the live temporal memory engine, keeps Neo4j as the graph database underneath, and uses TeamGraph as the control layer for permissions, approvals, API keys, audit logs, and UI workflows.

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
  -> API key validation
  -> Graphiti search / episode ingestion
  -> Neo4j
```

Graphiti is not exposed directly. All reads and writes go through the TeamGraph backend so organization scoping, approval routing, visibility rules, activity logs, and future billing controls stay intact.

## Why Graphiti

The original P0 stored product memory directly in Neo4j. This upgrade adds Graphiti as the live brain layer so TeamGraph can ingest temporal episodes, retrieve richer memory context, and still fall back safely to deterministic Neo4j retrieval when no LLM provider is configured.

## Features Preserved

- Landing page
- Demo admin/member login
- Brain Chat
- Context upload and inbox
- Approval queue
- API key management with hashed keys
- `@teamgraph/mcp` CLI and MCP server
- Graph visualization
- Dummy connectors
- Team roles
- Activity logs
- Local Neo4j Docker workflow

## Local Setup

1. Start Neo4j.

```bash
docker compose up -d neo4j
```

2. Apply the schema and seed demo data.

```bash
cd apps/api
python3 scripts/seed.py
```

3. Start the backend.

```bash
cd apps/api
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

4. Start the frontend.

```bash
cd apps/web
npm run dev
```

5. Build and link the CLI.

```bash
cd packages/teamgraph-mcp
npm run build
npm link
```

## Environment Variables

Copy `.env.example` to `.env` and configure as needed.

- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `GRAPHITI_LLM_PROVIDER`
- `NEO4J_URI`
- `NEO4J_USERNAME`
- `NEO4J_PASSWORD`
- `TEAMGRAPH_API_KEY`

Provider priority:

1. Gemini if configured
2. OpenAI-compatible if configured
3. Safe fallback mode if neither exists

## Demo Users

- Admin: `admin@teamgraph.local` / `password`
- Member: `member@teamgraph.local` / `password`

## Brain Chat Flow

1. User asks a question from the Brain page.
2. Backend validates role and project access.
3. TeamGraph calls the Graphiti wrapper for search.
4. Results are enriched with TeamGraph metadata and citations.
5. Gemini answers if configured, otherwise the backend returns a deterministic fallback answer.

## Context Upload Flow

1. UI or CLI uploads context.
2. TeamGraph stores `RawContext` metadata first.
3. Safety heuristics run for secrets, prompt injection, and low-quality content.
4. Curator assigns safety, quality, summary, tags, project, and visibility.
5. Safe context is ingested into Graphiti and linked back to TeamGraph `Context` metadata.
6. Risky context goes to the approval queue and is not ingested yet.
7. Unsafe context is quarantined and kept out of Graphiti.

## Approval Flow

- Admin approval ingests the queued item into Graphiti, updates metadata, and logs activity.
- Admin rejection preserves the audit trail and leaves Graphiti untouched.
- Members cannot approve or reject context.

## API Key Flow

- API keys are created in the dashboard.
- Raw keys are shown once and only hashed values are stored in Neo4j.
- MCP calls validate the API key and scope before accessing TeamGraph memory.

## CLI Commands

```bash
teamgraph-mcp login --api-key <key> [--server-url http://localhost:8000]
teamgraph-mcp status
teamgraph-mcp serve
teamgraph-mcp get-context --query "..." [--project "Core Platform"]
teamgraph-mcp upload-context --text "..." --project "Core Platform"
teamgraph-mcp upload-context --file ./context.md --project "Core Platform"
teamgraph-mcp list-context-sources
teamgraph-mcp optimize-graph
```

## Graphiti Modes

- `live`: Graphiti initialized successfully and is the primary retrieval/ingestion engine.
- `fallback`: Graphiti is unavailable or unconfigured. TeamGraph continues running via deterministic Neo4j-backed retrieval.

The dashboard shows Graphiti mode, Neo4j status, latest episode ingestion state, pending approvals, auto-curated count, and quarantined count.

## Slack and GitHub

Slack and GitHub integrations remain intentionally unfinished. The product keeps connector cards, backend stub structures, and coming-soon states, but does not implement real OAuth or syncing yet. The same is true for the other demo connectors shown in the UI.

## Known Limitations

- Graphiti runtime calls are wrapped defensively, but live Graphiti behavior still depends on local provider setup.
- Slack, GitHub, Notion, Drive, Jira, Teams, and Outlook are demo-only connectors.
- Demo auth is still local and static.
- The backfill utility only migrates trusted contexts that do not already have a Graphiti episode UUID.

See `CONTEXT.md` for the current implementation handoff and file-level status.
