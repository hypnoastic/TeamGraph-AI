# IMPLEMENTATION_PLAN.md — Antigravity Execution Plan

## 1. Build Strategy

Build P0 in slices. Keep it local, functional, and polished.

Main loop:

```txt
Neo4j starts
→ backend seeds graph
→ web login works
→ API key created
→ CLI login works
→ context upload creates RawContext
→ curator analyzes
→ auto/review/quarantine lane
→ graph updates
→ Brain Chat queries approved graph
```

## 2. Folder Structure

```txt
teamgraph-ai/
  README.md
  CONTEXT.md
  ANTIGRAVITY_GEMINI_MASTER_PROMPT.md
  P0_LIVE_BRAIN_SPEC.md
  PRODUCT_ARCHITECTURE.md
  BRAIN_CURATOR_SPEC.md
  NEO4J_LIVE_BRAIN_SCHEMA.md
  MCP_NPM_CLI_SPEC.md
  UI_STITCH_DESIGN_BRIEF.md
  SAFETY_AND_PERMISSIONS.md
  IMPLEMENTATION_PLAN.md
  DELIVERY_CHECKLIST.md
  .env.example
  .gitignore
  docker-compose.yml
  package.json

  apps/
    api/
      requirements.txt
      main.py
      config.py
      graph/
        neo4j_client.py
        schema.cypher
        seed_graph.py
        repositories.py
      auth/
        demo_auth.py
        permissions.py
        api_keys.py
      services/
        curator/
          schemas.py
          gemini_curator.py
          mock_curator.py
          safety_rules.py
          graph_harness.py
          optimizer.py
          answerer.py
        brain_service.py
        context_service.py
        graph_service.py
        activity_service.py
      routers/
        health.py
        auth.py
        brain.py
        context.py
        approvals.py
        api_keys.py
        connectors.py
        team.py
        graph.py
        mcp.py
        activity.py
        settings.py
      scripts/
        seed.py

    web/
      package.json
      src/
        app/
          page.tsx
          login/page.tsx
          dashboard/layout.tsx
          dashboard/page.tsx
          dashboard/brain/page.tsx
          dashboard/graph/page.tsx
          dashboard/context/page.tsx
          dashboard/approvals/page.tsx
          dashboard/api-keys/page.tsx
          dashboard/connectors/page.tsx
          dashboard/team/page.tsx
          dashboard/activity/page.tsx
          dashboard/settings/page.tsx
        components/
          shell/
          ui/
          brain/
          graph/
          context/
          approvals/
          keys/
          connectors/
          team/
        lib/

  packages/
    teamgraph-mcp/
      package.json
      tsconfig.json
      src/
        index.ts
        cli.ts
        config.ts
        apiClient.ts
        mcpServer.ts
        tools/
        parsers/
```

## 3. Phases and Commits

### Phase 1 — Root Setup

Create docs, env, gitignore, package root, CONTEXT.md.

Commit:

```bash
git commit -m "chore: initialize TeamGraph live brain P0" -m "Create root docs, environment examples, handoff context, and monorepo structure for the live context brain build."
```

### Phase 2 — Neo4j Docker and Schema

Create docker-compose, schema.cypher, seed graph.

Commit:

```bash
git commit -m "feat(graph): add Neo4j live brain schema" -m "Add local Neo4j Docker setup, constraints, indexes, and seed graph for organizations, users, raw context, curated context, curator runs, and review items."
```

### Phase 3 — FastAPI Scaffold

Create backend, config, health, Neo4j client.

Commit:

```bash
git commit -m "feat(api): add FastAPI backend scaffold" -m "Create backend service structure with config loading, health checks, and Neo4j connection utilities."
```

### Phase 4 — Auth, Roles, API Keys

Add demo login, admin/member roles, API key hashing, validation.

Commit:

```bash
git commit -m "feat(auth): add demo roles and scoped API keys" -m "Implement local admin/member login, permission guards, hashed API keys, key revocation, and scope validation."
```

### Phase 5 — Curator Service

Add schemas, mock curator, Gemini curator, safety rules, graph harness.

Commit:

```bash
git commit -m "feat(curator): add live brain curator harness" -m "Add Gemini-compatible structured curator schema, deterministic mock fallback, safety checks, lane decisions, and graph operation validation."
```

### Phase 6 — Context Upload and Lanes

Add context upload, RawContext, curator run, auto-curate/review/quarantine.

Commit:

```bash
git commit -m "feat(context): add risk-based context ingestion" -m "Create RawContext on upload, run curator analysis, auto-curate safe context, queue risky context, and quarantine unsafe context."
```

### Phase 7 — Approvals

Add approval queue endpoints and admin UI logic later.

Commit:

```bash
git commit -m "feat(approvals): add admin review workflow" -m "Add approval, rejection, and edit-approve flows for risky context proposed by the curator."
```

### Phase 8 — Brain Query

Add graph retrieval, answer synthesis, citations.

Commit:

```bash
git commit -m "feat(brain): add source-backed graph chat service" -m "Implement brain query retrieval over approved Neo4j context with related nodes, citations, timeline, and Gemini/mock answer synthesis."
```

### Phase 9 — Graph Optimizer

Add manual optimizer endpoint and service.

Commit:

```bash
git commit -m "feat(optimizer): add manual graph brain optimization" -m "Add graph optimizer that finds duplicates, orphan context, missing tags, stale nodes, and creates optimization run history."
```

### Phase 10 — MCP Backend Endpoints

Add `/mcp/*` endpoints for CLI.

Commit:

```bash
git commit -m "feat(mcp): add agent-facing backend tools" -m "Expose API-key authenticated endpoints for context retrieval, upload, graph optimization, and source listing."
```

### Phase 11 — NPM MCP CLI

Build package with login/status/serve/get-context/upload-context/optimize.

Commit:

```bash
git commit -m "feat(cli): add TeamGraph MCP npm package" -m "Create local npm package with CLI commands and stdio MCP server for external AI agents."
```

### Phase 12 — Stitch Design

Use Stitch MCP. Save DESIGN.md.

Commit:

```bash
git commit -m "design: add live brain UI direction" -m "Capture Stitch or manual design direction for the dark minimal graph-native interface."
```

### Phase 13 — Frontend Scaffold and UI Components

Next.js app, Tailwind, shell, ui primitives.

Commit:

```bash
git commit -m "feat(web): add Next.js live brain interface shell" -m "Add frontend scaffold, dashboard shell, design tokens, and reusable UI primitives."
```

### Phase 14 — Landing/Login/Brain Chat

Build landing, login, Brain Chat.

Commit:

```bash
git commit -m "feat(web): add landing login and brain chat" -m "Implement polished landing page, demo login, and source-backed organization brain chat UI."
```

### Phase 15 — Graph/Context/Approvals UI

Build graph, context inbox, approval queue.

Commit:

```bash
git commit -m "feat(web): add graph context inbox and approvals" -m "Add Neo4j graph visualization, context lanes, curator details, and admin approval workflow."
```

### Phase 16 — Keys/Connectors/Team/Activity UI

Build supporting pages.

Commit:

```bash
git commit -m "feat(web): add keys connectors team and activity pages" -m "Add API key management, dummy connectors, team roles, activity feed, and settings screens."
```

### Phase 17 — Wire Full App

Connect frontend to backend and polish.

Commit:

```bash
git commit -m "feat(app): wire live brain P0 end to end" -m "Connect web, backend, Neo4j, curator, API keys, approvals, graph visualization, and MCP CLI flows into a working local product."
```

### Phase 18 — Docs and Final QA

README, run commands, demo script, checklist.

Commit:

```bash
git commit -m "docs: finalize TeamGraph live brain P0 guide" -m "Document setup, demo users, Neo4j, backend, frontend, MCP CLI, curator behavior, safety model, and known limitations."
```

## 4. CONTEXT.md Maintenance

After each phase update:

- current status
- completed work
- files changed
- latest commit
- run commands
- known issues
- next steps

## 5. Run Commands

Neo4j:

```bash
docker compose up -d neo4j
```

Backend:

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed.py
uvicorn main:app --reload --port 8000
```

Frontend:

```bash
cd apps/web
npm install
npm run dev
```

CLI:

```bash
cd packages/teamgraph-mcp
npm install
npm run build
npm link
teamgraph-mcp login
teamgraph-mcp status
teamgraph-mcp get-context --query "why did we choose Neo4j"
```
