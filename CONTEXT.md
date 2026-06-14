# CONTEXT.md — TeamGraph Live Brain Handoff

*This document is the definitive handoff guide for any AI Agent or Developer picking up the TeamGraph AI Live Brain project.*

---

## 🎯 Current Status: P0 Completed
**Date:** June 2026
**State:** The entire P0 architecture has been successfully scaffolded, implemented, and built. The codebase is complete, the MCP CLI is compiled globally, the Next.js frontend is fully designed, and the FastAPI backend contains all necessary routes.

> [!WARNING]
> **Docker Daemon Issue on Host:** During the previous session, the local Docker Daemon on macOS was not running, preventing Neo4j from starting. 
> **Next Agent/Developer:** You MUST start Docker Desktop locally before running `docker-compose up` or starting the FastAPI backend, otherwise the database connection will fail.

---

## 🏗️ Architecture & Stack

### 1. Database: Neo4j
- **Location**: `docker-compose.yml` (runs Neo4j v5).
- **Schema**: Defined in `apps/api/graph/schema.cypher`. It includes constraints for `User`, `Project`, `Context`, `RawContext`, and `ReviewItem`.
- **Driver**: `Neo4jClient` singleton initialized on FastAPI startup.

### 2. Backend: FastAPI (`apps/api`)
- **Port**: 8000
- **Model**: `gemini-3.1-flash-lite` is prioritized across the app for cost-efficiency.
- **Core Services**:
  - `Context Service`: Ingests raw context, routes it to lanes (auto-curate, pending_review, quarantine).
  - `Curator Harness`: Uses `gemini-3.1-flash-lite` to extract safety, tags, and Neo4j node/edge operations. Defaults to a deterministic mock curator if no Gemini key is provided.
  - `Brain Service`: Queries the Neo4j graph using `fulltext` search, fetching context, and synthesizing answers via Gemini.
  - `Approvals`: Endpoints to accept/reject items queued for admin review.
  - `MCP Endpoints`: `mcp.router` validates external API keys and exposes tools (`get_context`, `upload_context`, `optimize_graph`) to the MCP CLI.

### 3. Frontend: Next.js + Tailwind (`apps/web`)
- **Port**: 3000
- **Design System**: A dark, premium, minimalistic theme generated via **Stitch MCP** based on `UI_STITCH_DESIGN_BRIEF.md`.
- **UI Pages Built**:
  - Landing & Login Flow
  - Brain Chat: Interactive query UI with citation references and agent status animations.
  - Graph Explorer: Built with `@xyflow/react`.
  - Context Inbox & Approvals UI.
  - API Keys, Connectors, Team, and Activity pages.

### 4. NPM MCP CLI (`packages/teamgraph-mcp`)
- **Execution**: The CLI is entirely **stateless**. It does not save config files locally.
- **Commands**:
  - `teamgraph-mcp install claude api="<your_api_key>"`: Finds `claude_desktop_config.json`, injects the `teamgraph-live-brain` server, and sets `TEAMGRAPH_API_KEY` in the environment block.
  - `teamgraph-mcp uninstall claude`: Removes the config cleanly.
  - Default (`teamgraph-mcp` with no args): Automatically starts the MCP stdio server. This is the exact command Claude executes in the background.

---

## 🚀 Runbook for the Next Session

When starting a new session, follow these steps exactly:

1. **Verify Docker**
   Ensure Docker Desktop is open and the daemon is running.
   ```bash
   docker info
   ```

2. **Start the Database**
   ```bash
   cd "Hakathon/TeamGraph AI"
   docker-compose up -d
   ```

3. **Initialize the Graph Schema** (If running for the first time)
   ```bash
   cd apps/api
   cat graph/schema.cypher | docker exec -i teamgraph-neo4j cypher-shell -u neo4j -p teamgraph123
   ```

4. **Start the Backend API**
   ```bash
   cd apps/api
   source venv/bin/activate
   # Ensure .env contains GEMINI_API_KEY
   uvicorn main:app --reload
   ```

5. **Start the Frontend Dashboard**
   ```bash
   cd apps/web
   npm run dev
   ```

---

## 🛠️ Next Recommended Steps (Phase 18+)

1. **End-to-End Verification**: Now that the code is complete, start Docker Desktop and run the full stack. Verify that the frontend can successfully communicate with the FastAPI backend and that data is successfully persisting in Neo4j.
2. **Test the MCP CLI Integration**: Run `teamgraph-mcp install claude api="tg_dev_123"` and verify that Claude Desktop can successfully pull context from the running `localhost:8000` FastAPI server.
3. **Expand Connectors**: Currently, connectors (Slack, GitHub, etc.) are UI-only dummies. The next major product phase is building actual ingestion webhooks for these services that pipe data directly into `/context/upload`.
