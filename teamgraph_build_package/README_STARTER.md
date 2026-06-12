# TeamGraph AI — Live Context Brain P0

TeamGraph AI is a live organization context brain for humans and AI agents.

It ingests context, stores raw evidence, uses a Gemini curator or deterministic mock curator to classify/summarize/tag/route context, stores trusted memory in Neo4j, lets users chat with the graph, and lets external agents retrieve/upload context through an npm MCP CLI.

## P0 Loop

```txt
login → create API key → CLI login → upload context → curator analyzes → auto/review/quarantine → Neo4j graph updates → Brain Chat answers with citations
```

## Run Neo4j

```bash
docker compose up -d neo4j
```

## Run Backend

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python scripts/seed.py
uvicorn main:app --reload --port 8000
```

## Run Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Run CLI

```bash
cd packages/teamgraph-mcp
npm install
npm run build
npm link
teamgraph-mcp login
teamgraph-mcp get-context --query "why did we choose Neo4j"
teamgraph-mcp upload-context --text "Decision: Safe context should auto-curate into graph." --project "Core Platform" --type decision --visibility project
```

## Demo Users

```txt
Admin: admin@teamgraph.local
Member: member@teamgraph.local
Org: Acme AI Lab
Domain: acme.local
```

## Local-only Note

This P0 is intentionally local-only. No hosting or real OAuth integrations are included yet.
