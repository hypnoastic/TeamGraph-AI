# TeamGraph AI
### *The Secure, Evolving Control Plane & Episodic Memory Gateway for Enterprise AI Agents*

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%20v15-050506?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Neo4j](https://img.shields.io/badge/Database-Neo4j%20Graph-008CC1?style=flat&logo=neo4j)](https://neo4j.com/)
[![PostgreSQL](https://img.shields.io/badge/Control--Plane-PostgreSQL-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org/)

---

## The Pitch
AI agents are revolutionizing how teams work, but they suffer from two critical flaws:
1. **Static, Disconnected Knowledge**: They lack long-term, evolving, episodic memory of past team decisions, context, and handoffs.
2. **Safety & Governance Deficit**: Giving agents direct access to write corporate knowledge bases is a compliance and hallucination nightmare.

**TeamGraph AI** solves this. It wraps **Graphiti** (episodic memory model) and **Neo4j** (graph database) with a robust, Postgres-backed governance layer. It provides a beautiful ChatGPT-style central brain interface for humans and a CLI/MCP server for AI agents—complete with human-in-the-loop safety gateways, API key scoping, and active connector state simulation.

---

## Architecture & Information Flow

```
                      +-------------------+
                      |   Human Operators  |
                      +---------+---------+
                                | (Brain Chat / Approvals UI)
                                v
                      +---------+---------+
                      | Next.js Web App   |
                      +---------+---------+
                                |
                                v
+------------------+  +---------+---------+  +-------------------+
| External Agents  |->| FastAPI Gateway   |<-|  Postgres Auth &  |
| (via MCP / CLI)  |  +---------+---------+  |  API Scoping DB   |
+------------------+            |            +-------------------+
                                v
                      +---------+---------+
                      |  Safety Gate /    |
                      |  Curation Engine  |
                      +---------+---------+
                                |
                                v
                      +---------+---------+
                      | Graphiti Service  |
                      +---------+---------+
                                |
                                v
                      +---------+---------+
                      | Neo4j memory DB   |
                      +-------------------+
```

---

## Core Features

### 1. Episodic Knowledge Graph (`/dashboard/graph`)
Visualizes organizational history over time using a dynamic, interactive `@xyflow/react` graph. Evolving episodes are highlighted in **rose**, and curated entities are in **amber**. Includes a metadata inspector and timeline log.

### 2. ChatGPT-Style Conversational Brain (`/dashboard/brain`)
Query the team's combined knowledge with interactive citations and context linkages. Suggestions are surfaced as small minimal pills. 

### 3. Human-in-the-Loop Safety Gate (`/dashboard/approvals`)
Any context uploaded by agents or connectors passes through an automated risk assessor. Items flagged with risk tags (e.g. `credential leak`, `contradictory context`) are held in the Approvals queue until approved or rejected by an admin.

### 4. Postgres-Backed Scoped API Credentials (`/dashboard/api-keys`)
Issue scoped tokens (`context.read`, `context.write`, `graph.optimize`) for external agents, securely hashing keys before storage.

### 5. Simulator Connectors (`/dashboard/connectors`)
Persisted simulated support for **Slack**, **GitHub**, and **Google Drive**. Clicking "Connect" instantly simulates Oauth; "Sync" launches a background progress spinner and updates sync status, cached in `localStorage` for demo reliability.

### 6. Model Context Protocol CLI (`packages/teamgraph-mcp`)
A node-based CLI allowing any MCP-compliant client (like Claude Desktop) to connect directly to the live TeamGraph memory.

---

## Hackathon Demo Walkthrough

Try the live flow using our pre-seeded **Demo Account**:

### Step 1: Login
- Go to `/login` and click the **Demo** shortcut button at the bottom (logs in as `demo@teamgraph.local` / `password`).

### Step 2: Query the Brain
- Land on **Brain Chat**. Type: *"What is the current status of the deployment?"* or click the pre-defined suggestion pills.
- Watch the layout transition into an active chat view displaying references to pre-seeded episodes.

### Step 3: Trigger a Sync
- Navigate to **Connectors**. Click **Connect** on **GitHub**, then click **Sync**. 
- Watch the progress wheel animate as the frontend mock simulates real-time data ingestion.

### Step 4: Approve Agent Context
- Go to **Context Inbox** to see raw data pipelines.
- Open **Approvals** to review quarantined items. Click **Approve** to let them through to the Graphiti engine.

---

## Local Installation

### Prerequisites
- Docker (for Neo4j)
- Node.js & npm (for Web & CLI)
- Python 3.10+ (for API)

### 1. Database Setup
Copy `.env.example` to `.env` and configure your database parameters. Start Neo4j:
```bash
docker compose up -d neo4j
```

### 2. Seed Database
Initialize and seed Postgres tables and the Neo4j instance:
```bash
cd apps/api
python3 scripts/seed.py
```

### 3. Run Backend
```bash
cd apps/api
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 4. Run Frontend
```bash
cd apps/web
npm run dev
```

### 5. Link MCP CLI
```bash
cd packages/teamgraph-mcp
npm run build
npm link
```
Use `teamgraph-mcp login --api-key <key> --server-url http://localhost:8000` to authenticate the CLI.

---

## Production Deployment
Deploy the full stack to AWS EC2 using the production Docker Compose setup:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```
Includes custom Nginx reverse-proxy setup (`deploy/nginx.conf`) and isolated production Dockerfiles for both services.

