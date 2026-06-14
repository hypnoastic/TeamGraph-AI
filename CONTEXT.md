# CONTEXT.md

## Current Implementation Status

- State: Graphiti-powered TeamGraph upgrade implemented.
- Date: June 14, 2026.
- Runtime model: TeamGraph backend controls all access, Graphiti is wrapped behind internal services, Neo4j remains the database, and fallback mode keeps the app usable without provider keys.

## What Changed

- Added a dedicated Graphiti wrapper under `apps/api/services/graphiti/`.
- Upgraded the backend runtime config to support Gemini, OpenAI-compatible, and fallback provider selection.
- Extended TeamGraph metadata so uploads, approvals, API keys, graph visualization, and activity logs continue working while Graphiti handles live memory ingestion and retrieval.
- Switched Brain Chat and MCP retrieval to Graphiti-first search with deterministic fallback answers.
- Wired the dashboard pages to backend endpoints instead of static placeholders.
- Expanded the `@teamgraph/mcp` CLI with login, status, direct commands, and the full TeamGraph MCP tool set.
- Added a trusted-context backfill utility for migrating existing `Context` nodes into Graphiti.

## Files Modified

### Backend

- `apps/api/main.py`
- `apps/api/config.py`
- `apps/api/database.py`
- `apps/api/requirements.txt`
- `apps/api/graph/neo4j_client.py`
- `apps/api/graph/schema.cypher`
- `apps/api/scripts/seed.py`
- `apps/api/routers/auth.py`
- `apps/api/routers/health.py`
- `apps/api/routers/settings.py`
- `apps/api/routers/context.py`
- `apps/api/routers/approvals.py`
- `apps/api/routers/brain.py`
- `apps/api/routers/mcp.py`
- `apps/api/routers/api_keys.py`
- `apps/api/auth/demo_auth.py`
- `apps/api/auth/api_keys.py`
- `apps/api/services/context_service.py`
- `apps/api/services/brain_service.py`
- `apps/api/services/curator/graph_harness.py`
- `apps/api/services/curator/safety_rules.py`
- `apps/api/services/curator/mock_curator.py`

### Backend Files Added

- `apps/api/services/graphiti/__init__.py`
- `apps/api/services/graphiti/config.py`
- `apps/api/services/graphiti/client.py`
- `apps/api/services/graphiti/schemas.py`
- `apps/api/services/graphiti/episodes.py`
- `apps/api/services/graphiti/search.py`
- `apps/api/services/graphiti/fallback.py`
- `apps/api/services/graphiti/service.py`
- `apps/api/services/activity_service.py`
- `apps/api/services/team_service.py`
- `apps/api/services/graph_visualization_service.py`
- `apps/api/services/connectors/__init__.py`
- `apps/api/services/connectors/base.py`
- `apps/api/services/connectors/slack_stub.py`
- `apps/api/services/connectors/github_stub.py`
- `apps/api/services/connectors/registry.py`
- `apps/api/routers/graph.py`
- `apps/api/routers/activity.py`
- `apps/api/routers/team.py`
- `apps/api/routers/connectors.py`
- `apps/api/scripts/backfill_graphiti.py`

### Frontend

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/dashboard/layout.tsx`
- `apps/web/src/app/dashboard/brain/page.tsx`
- `apps/web/src/app/dashboard/context/page.tsx`
- `apps/web/src/app/dashboard/approvals/page.tsx`
- `apps/web/src/app/dashboard/graph/page.tsx`
- `apps/web/src/app/dashboard/api-keys/page.tsx`
- `apps/web/src/app/dashboard/connectors/page.tsx`
- `apps/web/src/app/dashboard/team/page.tsx`
- `apps/web/src/app/dashboard/activity/page.tsx`
- `apps/web/src/app/dashboard/settings/page.tsx`

### Frontend Files Added

- `apps/web/src/lib/api.ts`
- `apps/web/src/lib/config.ts`
- `apps/web/src/lib/types.ts`

### CLI

- `packages/teamgraph-mcp/src/apiClient.ts`
- `packages/teamgraph-mcp/src/cli.ts`
- `packages/teamgraph-mcp/src/index.ts`
- `packages/teamgraph-mcp/src/mcpServer.ts`
- `packages/teamgraph-mcp/src/configStore.ts`
- `packages/teamgraph-mcp/src/types.ts`

### Docs and Infra

- `README.md`
- `CONTEXT.md`
- `.env.example`
- `docker-compose.yml`

## How Graphiti Is Integrated

- TeamGraph initializes Graphiti on backend startup through `graphiti_service.initialize_graphiti()`.
- Safe context uploads and admin-approved review items are converted into `EpisodeMetadata` and ingested via `add_episode_for_context()`.
- Brain Chat and MCP retrieval call `search_brain()` first.
- TeamGraph still stores `RawContext`, `Context`, `ReviewItem`, `ApiKeyRef`, and `ActivityEvent` metadata in Neo4j for scoping, approvals, visibility, and audits.
- If Graphiti initialization or search fails, TeamGraph falls back to Neo4j-backed deterministic retrieval instead of breaking the product.

## How To Run Everything

1. Start Neo4j.

```bash
docker compose up -d neo4j
```

2. Seed the schema and demo data.

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

6. Optional backfill for existing trusted context.

```bash
cd apps/api
source .venv/bin/activate
python3 scripts/backfill_graphiti.py
```

## Known Issues

- Graphiti live mode depends on valid local provider credentials and the exact installed `graphiti-core` API surface.
- Fallback mode keeps the product running, but the resulting answers are deterministic summaries rather than fully model-generated answers.
- Slack and GitHub connectors remain stubbed and intentionally do not perform OAuth or syncing.
- The seeded demo environment is single-org and uses static demo auth.

## Next Steps

- Run a full local smoke test with Neo4j plus a real provider key to validate end-to-end Graphiti ingestion and retrieval behavior.
- Add targeted backend tests around fallback mode, approval ingestion, and API key scope enforcement.
- Expand the graph visualization adapter if deeper Graphiti entity and relationship mapping is needed.
- Replace demo connector stubs with real integrations in a later phase without bypassing TeamGraph safety and permission checks.
