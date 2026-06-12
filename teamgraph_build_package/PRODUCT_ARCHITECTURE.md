# PRODUCT_ARCHITECTURE.md — TeamGraph AI Live Brain Architecture

## 1. System Overview

TeamGraph AI P0 has five core subsystems:

```txt
Web App
FastAPI Backend
Neo4j Brain Graph
Gemini Curator / Mock Curator
NPM MCP CLI
```

## 2. Architecture Diagram

```txt
User / Admin
   ↓
Next.js Web App
   ↓
FastAPI Backend
   ↓
Neo4j Brain Graph

External AI Agent
   ↓
teamgraph-mcp npm CLI
   ↓
MCP stdio server
   ↓
FastAPI Backend
   ↓
Neo4j Brain Graph

Context Upload
   ↓
RawContext
   ↓
Gemini Curator / Mock Curator
   ↓
Graph Change Harness
   ↓
Auto-curate OR Review OR Quarantine
   ↓
Neo4j Trusted Context
```

## 3. Technology Choices

### Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- lucide-react
- framer-motion
- React Flow / @xyflow/react

### Backend

- Python FastAPI
- Pydantic
- Neo4j Python driver
- SQLite optional for session/API key metadata
- Uvicorn

### Graph

- Neo4j via Docker Compose
- Cypher constraints and seed script
- No raw Cypher from model

### Curator

- Gemini API if env vars exist
- Mock deterministic curator if no keys
- Structured JSON output schema

### MCP CLI

- TypeScript
- Node.js
- `@modelcontextprotocol/sdk`
- commander
- inquirer
- zod
- config in `~/.teamgraph/config.json`

## 4. Data Flow: Context Upload

```txt
upload-context command or UI upload
   ↓
POST /context/upload
   ↓
RawContext node created in Neo4j
   ↓
Curator service runs
   ↓
CuratorRun node created
   ↓
SafetySignal nodes created
   ↓
Graph operation proposal stored
   ↓
Harness policy decides lane
   ↓
Auto-curated Context OR ReviewItem OR Quarantine
```

## 5. Data Flow: Brain Chat

```txt
User question
   ↓
POST /brain/query
   ↓
Scope user/org/project
   ↓
Neo4j retrieval
   ↓
Graph neighborhood expansion
   ↓
Gemini/mock answer synthesis
   ↓
Answer + citations + related nodes
```

## 6. Data Flow: MCP Agent Context

```txt
AI agent calls MCP get_context
   ↓
teamgraph-mcp stdio server
   ↓
Backend API with API key
   ↓
Validate API key and scopes
   ↓
Retrieve approved graph context
   ↓
Return compact context to agent
```

## 7. Important Safety Boundary

Never do this:

```txt
Gemini output → raw Cypher → execute
```

Always do this:

```txt
Gemini output → structured proposal JSON → validate operation allowlist → execute safe service method
```

## 8. Allowed Graph Harness Operations

The model may propose:

- CREATE_CONTEXT
- CREATE_TAG
- LINK_CONTEXT_TO_PROJECT
- LINK_CONTEXT_TO_USER_GRAPH
- LINK_RELATED_CONTEXT
- MARK_DUPLICATE
- MARK_CONFLICT
- UPDATE_CONTEXT_SUMMARY
- UPDATE_RETRIEVAL_PRIORITY
- CREATE_REVIEW_ITEM
- QUARANTINE_CONTEXT
- SUGGEST_MERGE

The backend applies only safe operations.

## 9. Disallowed Operations

Never allow model to directly:

- delete user
- delete organization
- delete project
- delete raw context
- remove evidence
- change permissions
- revoke API key
- run raw Cypher
- overwrite raw uploaded text
- auto-approve unsafe content
