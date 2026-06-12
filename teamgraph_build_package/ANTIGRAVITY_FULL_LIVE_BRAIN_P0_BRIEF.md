# ANTIGRAVITY + GEMINI 3.1 PRO MASTER PROMPT — TeamGraph AI Live Brain P0

You are Antigravity running a high-reasoning Gemini model. Build the complete local-first P0 for **TeamGraph AI** from the markdown files in this repository root.

Read these files first, in this exact order:

1. `P0_LIVE_BRAIN_SPEC.md`
2. `PRODUCT_ARCHITECTURE.md`
3. `BRAIN_CURATOR_SPEC.md`
4. `NEO4J_LIVE_BRAIN_SCHEMA.md`
5. `MCP_NPM_CLI_SPEC.md`
6. `UI_STITCH_DESIGN_BRIEF.md`
7. `SAFETY_AND_PERMISSIONS.md`
8. `IMPLEMENTATION_PLAN.md`
9. `DELIVERY_CHECKLIST.md`

Then implement the project.

## Product Summary

TeamGraph AI is a **live organization context brain** for humans and AI agents.

It does not just dump Slack/GitHub/Jira/Drive/context data into a database. It ingests context, keeps the raw evidence, uses a Gemini-powered curator to classify safety and quality, summarizes the context, assigns tags, detects duplicates/conflicts, proposes graph placement, auto-commits safe context, sends risky context to admin review, and continuously optimizes a Neo4j memory graph so AI agents can retrieve the best context quickly through MCP.

## P0 Must Prove This Loop

```txt
Landing
→ login as admin/member
→ dummy connectors visible
→ API key creation
→ npm MCP CLI login
→ MCP get-context retrieves from Neo4j
→ MCP upload-context pushes new raw context
→ Gemini curator/mock curator analyzes it
→ safe context auto-enters curated graph, risky context goes to review
→ admin can approve/reject/edit review items
→ Brain Chat answers questions using approved graph context
→ graph visualization shows raw, curated, pending, users, projects, agent sessions, curator runs
```

## Critical Product Rules

- Build local-only. No hosting.
- Use Neo4j via Docker Compose as the real graph backend.
- Use Python FastAPI for backend.
- Use Next.js + TypeScript + Tailwind for frontend.
- Use TypeScript npm package for MCP CLI at `packages/teamgraph-mcp`.
- Use Stitch MCP for UI design if available.
- If Stitch MCP is unavailable, create `DESIGN.md` from `UI_STITCH_DESIGN_BRIEF.md` and continue.
- Use Gemini API only if env vars exist.
- If Gemini keys are missing, implement a deterministic mock curator with the same JSON output schema.
- Never let the model execute raw Cypher.
- Model can only return structured graph proposals.
- Backend graph harness validates and applies allowed operations.
- Maintain `CONTEXT.md` after every major phase.
- Make many meaningful commits after small working slices.
- Do not commit secrets, `.env`, node_modules, `.next`, virtualenvs, Neo4j data, SQLite db files, or build artifacts.

## Main P0 Pages

- Landing
- Login
- Brain Chat
- Graph
- Context Inbox
- Approvals
- API Keys
- Connectors
- Team
- Activity
- Settings

The main logged-in page should be **Brain Chat**, not a static dashboard. It should feel like chatting with the organization brain, with graph citations and related nodes, not a generic chatbot.

## Final Output Required

When finished, print:

1. What was built.
2. How to run Neo4j.
3. How to run backend.
4. How to run frontend.
5. How to build/link npm MCP CLI.
6. Demo admin/member login.
7. API key creation flow.
8. MCP client config.
9. CLI command examples.
10. Gemini curator/mock curator behavior.
11. Implemented MCP tools.
12. Git commit count and latest commits.
13. GitHub repo status if attempted.
14. Path to `CONTEXT.md`.
15. Known limitations.


---

# P0_LIVE_BRAIN_SPEC.md — TeamGraph AI Live Context Brain

## 1. Product Identity

### Name

**TeamGraph AI**

### Subtitle

**ContextOS for AI Agents**

### Tagline

```txt
A live context brain for every teammate and every AI agent.
```

### One-liner

TeamGraph AI continuously curates organizational context into an optimized Neo4j knowledge graph, so humans and AI agents can retrieve trusted context without rediscovering work.

---

## 2. P0 Product Thesis

Most AI work tools store data. TeamGraph AI should behave like a brain.

It should:

1. Receive raw context from humans, connectors, or AI agents.
2. Keep raw evidence immutable.
3. Use Gemini Lite/Gemini model or a mock curator to classify safety and quality.
4. Summarize messy context into clean memory.
5. Tag and prioritize context.
6. Detect duplicates, conflicts, unsafe data, low-quality data, and possible prompt injection.
7. Suggest where the context belongs in Neo4j.
8. Auto-curate safe context.
9. Send risky context to an admin approval queue.
10. Periodically or manually optimize the graph.
11. Let users chat with the approved organization graph.
12. Let external AI agents retrieve/upload context through MCP.

P0 must prove this “live brain” loop locally.

---

## 3. What P0 Includes

### Must Build

- Polished landing page
- Demo login as admin/member
- Dummy connectors for Slack, GitHub, Google Drive, Notion, Jira, Teams, Outlook, Docs
- Team role management: admin/member
- API key creation/revocation
- Neo4j Docker setup
- FastAPI backend
- Gemini curator service with deterministic mock fallback
- Context upload API
- Risk-based context inbox
- Approval queue for risky context
- Auto-curation for safe context
- Brain Chat as main logged-in page
- Neo4j graph visualization
- Graph optimizer button
- Curator run history/activity
- NPM MCP CLI package
- MCP stdio server through CLI
- CLI commands: login, status, serve, get-context, upload-context, optimize
- CONTEXT.md handoff maintained

### Must Not Build

- Real Slack OAuth
- Real GitHub OAuth
- Real Google Drive OAuth
- Real Notion OAuth
- Production SSO
- Billing
- Hosting/deployment
- Full enterprise policy engine
- Direct raw Cypher from LLM
- Generic chatbot disconnected from graph context

---

## 4. Users and Roles

P0 has only two roles.

### Admin

Can:

- Login
- View all organization graph context
- View all user/project context
- Manage dummy connectors
- Add/edit team members
- Create/revoke any API key
- View Brain Chat
- View Context Inbox
- Approve/reject/edit risky context
- Run graph optimizer
- View activity/curator history

### Member

Can:

- Login
- View Brain Chat for accessible context
- Generate own API key if enabled
- Use npm MCP CLI
- Upload context through CLI/app/MCP
- View own uploaded context
- View project-visible context
- Cannot manage connectors
- Cannot manage team
- Cannot approve risky context
- Cannot access another user’s private context

Demo users:

```txt
Admin: admin@teamgraph.local
Member: member@teamgraph.local
Organization: Acme AI Lab
Domain: acme.local
```

---

## 5. Core Pages

### 5.1 Landing `/`

Hero:

```txt
A live context brain for every teammate and every AI agent.
```

Subtext:

```txt
TeamGraph AI turns scattered work context into a curated Neo4j memory graph, so agents can retrieve the right context instead of rediscovering everything.
```

Show architecture:

```txt
Connectors + MCP Uploads
→ Raw Context
→ Gemini Curator
→ Safe Auto-Curation / Risk Review
→ Neo4j Context Brain
→ Brain Chat + MCP Agents
```

CTA:

```txt
Open demo workspace
```

### 5.2 Login `/login`

Fields:

- email
- organization domain

Demo shortcuts:

- Login as Admin
- Login as Member

### 5.3 Brain Chat `/dashboard` or `/dashboard/brain`

Main logged-in page.

This is not a generic chatbot. It is **Chat with the Organization Brain**.

Users can ask:

```txt
What has been done for the MCP CLI?
Why did we choose Neo4j?
What context was uploaded by the member?
What is unsafe or pending review?
What is the task history for graph optimization?
What should the next agent continue from?
```

Answer should show:

- concise answer
- graph nodes used
- source citations
- confidence
- timeline if relevant
- related nodes
- suggested next actions

### 5.4 Graph `/dashboard/graph`

Show Neo4j graph visualization.

Use React Flow.

Show nodes:

- Organization
- User
- UserGraph
- Project
- RawContext
- Context
- PendingContext
- ReviewItem
- CuratorRun
- SafetySignal
- Tag
- ApiKeyRef
- AgentSession
- MCPCall
- GraphOptimizationRun

Show filters:

- Raw
- Curated
- Pending
- Unsafe
- User graph
- Project graph
- Agent sessions
- Curator runs

### 5.5 Context Inbox `/dashboard/context`

Shows all uploaded context by lane:

- Auto-curated
- Pending review
- Quarantined
- Low quality
- Duplicate/conflict

Users can upload context manually here too.

### 5.6 Approvals `/dashboard/approvals`

Admin-only.

Shows risky context needing review.

Each card:

- raw upload
- curator summary
- safety status
- risk tags
- quality score
- suggested graph operations
- reason for review
- approve
- reject
- edit and approve

### 5.7 API Keys `/dashboard/api-keys`

Users can create scoped keys.

Admin can create/revoke for anyone. Member can create own keys if enabled.

Scopes:

```txt
context:read
context:upload
graph:read
mcp:connect
brain:query
```

Key shown once. Store only hash.

### 5.8 Connectors `/dashboard/connectors`

Dummy connector cards:

- Slack
- GitHub
- Google Drive
- Notion
- Jira
- Microsoft Teams
- Outlook
- Docs Upload

Each card:

- status
- mode
- description
- Configure later
- Use demo data

No real OAuth.

### 5.9 Team `/dashboard/team`

Admin can:

- add member
- change role admin/member
- disable member

Member sees own profile/access only.

### 5.10 Activity `/dashboard/activity`

Show:

- login events
- API key generated/revoked
- context uploaded
- curator run
- auto-curated context
- review queued
- approval/rejection
- brain query
- MCP tool call
- graph optimization run

### 5.11 Settings `/dashboard/settings`

Show:

- organization info
- local environment status
- Neo4j status
- Gemini status: live/mock
- reset seed data
- run optimizer

---

## 6. Context Brain Ingestion Flow

### Step 1: Context push

Source can be:

- UI upload
- MCP CLI upload
- dummy connector seed
- future Slack/Jira/GitHub/Drive adapter

Create immutable `RawContext`.

### Step 2: Curator run

Run Gemini curator if available, otherwise mock curator.

Curator returns structured JSON:

- safety status
- risk tags
- quality score
- context type
- summary
- canonical title
- tags
- suggested project
- suggested visibility
- duplicate/conflict candidates
- graph operation proposal
- decision lane: auto_curate / review / quarantine

### Step 3: Harness applies policy

Backend decides:

```txt
safe + high quality + no conflict → auto-curate
risky/low confidence/conflict → review queue
unsafe/secrets/prompt injection → quarantine
```

### Step 4: Graph update

Auto-curated context becomes trusted `Context`.

Pending context becomes `ReviewItem`.

Quarantined context stays inaccessible except admin.

---

## 7. Graph Optimization Flow

Graph optimizer can be run manually in P0.

Button:

```txt
Run Brain Optimization
```

CLI command:

```bash
teamgraph-mcp optimize
```

Optimizer should:

- find duplicate context titles/tags
- find orphan RawContext nodes
- find untagged context
- suggest links between related context
- update retrieval priority
- generate project summaries
- mark stale/low-quality context
- create `GraphOptimizationRun` node

For P0, implement lightweight heuristic optimizer + optional Gemini enrichment.

Do not implement destructive graph rewrites.

---

## 8. Brain Chat Retrieval Flow

When user asks a question:

1. Authenticate user.
2. Identify org/project scope.
3. Query Neo4j for matching approved Context nodes.
4. Expand 1-2 hop graph neighborhood.
5. Include curator summaries, tags, task history, and source evidence.
6. Use Gemini or mock answerer to synthesize answer.
7. Return:
   - answer
   - citations
   - related nodes
   - timeline
   - confidence
   - suggested next actions

If Gemini key missing, return deterministic answer from retrieved context.

---

## 9. P0 Demo Script

1. Open landing page.
2. Login as admin.
3. Show Brain Chat.
4. Ask: “Why did we choose Neo4j?”
5. Show source-backed answer.
6. Open Connectors. Show dummy apps.
7. Open API Keys. Create key for member/task.
8. Link npm CLI locally.
9. Run `teamgraph-mcp login`.
10. Run `teamgraph-mcp get-context --query "Neo4j decision"`.
11. Upload context:
    ```bash
    teamgraph-mcp upload-context --text "Decision: Brain curator should auto-curate safe context and queue risky context." --project "Core Platform" --type decision --visibility project
    ```
12. Show curator run created.
13. Show safe context auto-curated or risky context in approvals.
14. Approve if pending.
15. Open graph and show new context connected.
16. Run Brain Optimization.
17. Ask Brain Chat: “What changed after the latest upload?”

---

## 10. P0 Acceptance Criteria

P0 is complete when:

- Landing works
- Admin/member login works
- Brain Chat works with retrieved graph context
- Dummy connectors exist
- Team roles work
- API key generation/revoke works
- Neo4j runs through Docker Compose
- Seed graph works
- Context upload creates RawContext
- Curator/mock curator runs on upload
- Safe context auto-curates
- Risky context appears in approval queue
- Admin approve/reject works
- Graph optimizer button works
- Graph visualization shows context brain
- NPM MCP CLI builds/links locally
- MCP CLI login/status/get-context/upload-context works
- Uploaded context appears in Neo4j and app
- CONTEXT.md exists and is updated


---

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


---

# BRAIN_CURATOR_SPEC.md — Gemini Curator and Live Brain Harness

## 1. Purpose

The Brain Curator is the intelligence layer that prevents TeamGraph from becoming a dump.

It handles:

- safety classification
- quality scoring
- summarization
- tag extraction
- duplicate detection
- conflict detection
- graph placement
- retrieval priority scoring
- lane decision: auto_curate / review / quarantine

## 2. Runtime Modes

### Live Gemini Mode

Use Gemini API if these exist:

```txt
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

If the model name is unavailable, use the configured env model. Do not hardcode failure.

### Mock Curator Mode

If no Gemini key exists, use deterministic mock curator.

Mock curator must return the exact same JSON schema.

This ensures P0 works locally without paid APIs.

## 3. Curator Input

```json
{
  "raw_context_id": "raw_123",
  "organization": "Acme AI Lab",
  "project": "Core Platform",
  "uploaded_by": "member@teamgraph.local",
  "source": "mcp-cli",
  "visibility_requested": "project",
  "content": "Decision: Brain curator should auto-curate safe context and queue risky context.",
  "existing_context_summaries": [
    {
      "id": "ctx_1",
      "title": "Use Neo4j for P0",
      "summary": "Neo4j is the graph backend for P0."
    }
  ]
}
```

## 4. Curator Output Schema

Return strict JSON:

```json
{
  "safety": {
    "status": "safe",
    "risk_tags": [],
    "reason": "No secrets, no prompt injection, no unsafe content detected."
  },
  "quality": {
    "score": 0.88,
    "signals": ["specific", "project_relevant", "actionable"]
  },
  "classification": {
    "context_type": "decision",
    "canonical_title": "Brain curator auto-curates safe context",
    "summary": "Safe context should be automatically curated into the graph, while risky context should be sent to admin review.",
    "suggested_project": "Core Platform",
    "suggested_visibility": "project",
    "suggested_tags": ["brain-curator", "approval", "context-ingestion"]
  },
  "relationships": [
    {
      "from": "Brain curator auto-curates safe context",
      "relation": "RELATED_TO",
      "to": "Use Neo4j for P0",
      "confidence": 0.74
    }
  ],
  "duplicates": [],
  "conflicts": [],
  "retrieval": {
    "importance_score": 0.82,
    "freshness_score": 0.99,
    "retrieval_priority": 0.86
  },
  "lane": {
    "decision": "auto_curate",
    "reason": "Safe, high quality, no conflict."
  },
  "graph_operations": [
    {
      "operation": "CREATE_CONTEXT",
      "title": "Brain curator auto-curates safe context",
      "context_type": "decision",
      "summary": "Safe context should be automatically curated into the graph, while risky context should be sent to admin review.",
      "visibility": "project"
    },
    {
      "operation": "LINK_CONTEXT_TO_PROJECT",
      "project": "Core Platform"
    }
  ]
}
```

## 5. Safety Status Values

```txt
safe
needs_review
unsafe
sensitive
prompt_injection
low_quality
duplicate
conflicting
```

## 6. Lane Decisions

### auto_curate

Allowed when:

- safety status is safe
- quality score >= 0.70
- no serious conflict
- no secret detected
- no prompt injection
- visibility is private or project
- model confidence is acceptable

### review

Required when:

- safety status is needs_review
- quality score between 0.40 and 0.70
- conflict detected
- duplicate likely
- organization-wide visibility requested
- content claims major decision or task completion
- content has low confidence
- source is unknown

### quarantine

Required when:

- secrets detected
- passwords/API keys detected
- prompt injection detected
- unsafe or malicious content
- content attempts to modify system behavior
- sensitive private data detected

## 7. Secret and Prompt Injection Heuristics

Before Gemini, run simple regex/rule checks:

Secrets:

```txt
api_key=
secret=
password=
token=
-----BEGIN PRIVATE KEY-----
sk-
ghp_
xoxb-
```

Prompt injection patterns:

```txt
ignore previous instructions
forget all instructions
system prompt
developer message
reveal secrets
override policy
```

If detected, force review/quarantine even if model says safe.

## 8. Graph Optimizer

Optimizer runs manually in P0.

Input:

```json
{
  "organization_id": "org_1",
  "project": "Core Platform",
  "mode": "manual"
}
```

It should:

- find untagged context
- find duplicate titles/summaries
- find orphan RawContext
- update retrieval priority
- create project summary context
- identify stale context
- create suggested links
- create GraphOptimizationRun node

P0 optimizer can be heuristic.

Gemini can improve summaries if available.

## 9. Query Answerer

Brain Chat uses Gemini/mock answerer.

Input:

- user question
- retrieved graph context
- citations
- related nodes

Output:

```json
{
  "answer": "You chose Neo4j because TeamGraph depends on graph-native relationships between users, projects, context, API keys, and agent sessions.",
  "confidence": 0.86,
  "citations": [
    {
      "context_id": "ctx_neo4j_decision",
      "title": "Use Neo4j for P0"
    }
  ],
  "related_nodes": ["Core Platform", "Neo4j", "Graph Backend"],
  "timeline": [
    {
      "event": "Decision uploaded",
      "context_id": "ctx_neo4j_decision"
    }
  ],
  "suggested_next_actions": [
    "Run graph optimizer after importing more context."
  ]
}
```

## 10. Implementation Files

```txt
apps/api/services/curator/
  __init__.py
  schemas.py
  gemini_curator.py
  mock_curator.py
  safety_rules.py
  graph_harness.py
  optimizer.py
  answerer.py
```


---

# NEO4J_LIVE_BRAIN_SCHEMA.md — Neo4j Schema for TeamGraph Live Brain

## 1. Core Design

Neo4j is the source of truth for the context brain.

The graph has:

1. Organization structure
2. User personal graphs
3. Projects
4. Raw context
5. Curated trusted context
6. Pending review items
7. Safety signals
8. Curator runs
9. API key references
10. Agent sessions and MCP calls
11. Optimization runs

## 2. Node Labels

### Organization

```cypher
(:Organization {
  id,
  name,
  domain,
  createdAt
})
```

### User

```cypher
(:User {
  id,
  name,
  email,
  role,
  status,
  createdAt
})
```

Roles:

```txt
admin
member
```

### UserGraph

```cypher
(:UserGraph {
  id,
  userId,
  name,
  createdAt
})
```

### Project

```cypher
(:Project {
  id,
  name,
  description,
  status,
  createdAt
})
```

### Connector

```cypher
(:Connector {
  id,
  type,
  name,
  status,
  mode,
  createdAt
})
```

Types:

```txt
slack
github
google_drive
notion
jira
teams
outlook
docs_upload
mcp_upload
manual_upload
```

### RawContext

Immutable source upload.

```cypher
(:RawContext {
  id,
  title,
  content,
  source,
  sourceType,
  visibilityRequested,
  createdAt
})
```

### Context

Trusted curated context.

```cypher
(:Context {
  id,
  title,
  type,
  summary,
  content,
  visibility,
  qualityScore,
  importanceScore,
  freshnessScore,
  retrievalPriority,
  status,
  createdAt,
  updatedAt
})
```

Types:

```txt
note
decision
task
blocker
api
handoff
meeting
doc
code_context
agent_progress
project_summary
```

Status:

```txt
trusted
archived
stale
duplicate
conflicting
```

### ReviewItem

```cypher
(:ReviewItem {
  id,
  status,
  reason,
  riskTags,
  qualityScore,
  createdAt,
  reviewedAt
})
```

Status:

```txt
pending
approved
rejected
edited_approved
quarantined
```

### CuratorRun

```cypher
(:CuratorRun {
  id,
  model,
  mode,
  laneDecision,
  confidence,
  createdAt
})
```

Mode:

```txt
gemini
mock
```

### SafetySignal

```cypher
(:SafetySignal {
  id,
  status,
  tag,
  reason,
  severity,
  createdAt
})
```

### Tag

```cypher
(:Tag {
  id,
  name
})
```

### ApiKeyRef

No raw key.

```cypher
(:ApiKeyRef {
  id,
  keyPrefix,
  userId,
  projectId,
  purpose,
  scopes,
  status,
  createdAt,
  lastUsedAt
})
```

### AgentSession

```cypher
(:AgentSession {
  id,
  agentName,
  client,
  startedAt,
  lastActiveAt
})
```

### MCPCall

```cypher
(:MCPCall {
  id,
  toolName,
  query,
  status,
  createdAt
})
```

### GraphOptimizationRun

```cypher
(:GraphOptimizationRun {
  id,
  mode,
  summary,
  changesSuggested,
  changesApplied,
  createdAt
})
```

## 3. Relationships

### Org Structure

```cypher
(:Organization)-[:HAS_MEMBER]->(:User)
(:Organization)-[:HAS_PROJECT]->(:Project)
(:Organization)-[:HAS_CONNECTOR]->(:Connector)
```

### User Graph

```cypher
(:User)-[:HAS_PERSONAL_GRAPH]->(:UserGraph)
(:UserGraph)-[:CONTAINS]->(:Context)
(:UserGraph)-[:CONTAINS_RAW]->(:RawContext)
```

### Context Lifecycle

```cypher
(:User)-[:UPLOADED]->(:RawContext)
(:RawContext)-[:ANALYZED_BY]->(:CuratorRun)
(:CuratorRun)-[:FLAGGED]->(:SafetySignal)
(:RawContext)-[:CURATED_INTO]->(:Context)
(:RawContext)-[:QUEUED_AS]->(:ReviewItem)
(:ReviewItem)-[:APPROVED_AS]->(:Context)
(:RawContext)-[:QUARANTINED_AS]->(:ReviewItem)
```

### Project Graph

```cypher
(:Project)-[:HAS_CONTEXT]->(:Context)
(:Context)-[:BELONGS_TO]->(:Project)
(:Project)-[:HAS_RAW_CONTEXT]->(:RawContext)
```

### Tags and Relationships

```cypher
(:Context)-[:HAS_TAG]->(:Tag)
(:Context)-[:RELATED_TO]->(:Context)
(:Context)-[:DEPENDS_ON]->(:Context)
(:Context)-[:BLOCKS]->(:Context)
(:Context)-[:DUPLICATES]->(:Context)
(:Context)-[:CONFLICTS_WITH]->(:Context)
(:Context)-[:SUMMARIZES]->(:Context)
```

### API/MCP

```cypher
(:User)-[:OWNS_API_KEY]->(:ApiKeyRef)
(:ApiKeyRef)-[:SCOPED_TO]->(:Project)
(:ApiKeyRef)-[:USED_BY]->(:AgentSession)
(:AgentSession)-[:MADE_CALL]->(:MCPCall)
(:MCPCall)-[:RETURNED_CONTEXT]->(:Context)
(:AgentSession)-[:UPLOADED_RAW_CONTEXT]->(:RawContext)
```

### Optimization

```cypher
(:GraphOptimizationRun)-[:SUGGESTED_LINK]->(:Context)
(:GraphOptimizationRun)-[:UPDATED_PRIORITY]->(:Context)
(:GraphOptimizationRun)-[:CREATED_SUMMARY]->(:Context)
```

## 4. Constraints

```cypher
CREATE CONSTRAINT organization_id IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

CREATE CONSTRAINT user_id IF NOT EXISTS
FOR (u:User) REQUIRE u.id IS UNIQUE;

CREATE CONSTRAINT user_email IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE;

CREATE CONSTRAINT project_id IF NOT EXISTS
FOR (p:Project) REQUIRE p.id IS UNIQUE;

CREATE CONSTRAINT raw_context_id IF NOT EXISTS
FOR (r:RawContext) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT context_id IF NOT EXISTS
FOR (c:Context) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT review_item_id IF NOT EXISTS
FOR (r:ReviewItem) REQUIRE r.id IS UNIQUE;

CREATE CONSTRAINT curator_run_id IF NOT EXISTS
FOR (c:CuratorRun) REQUIRE c.id IS UNIQUE;

CREATE CONSTRAINT api_key_ref_id IF NOT EXISTS
FOR (k:ApiKeyRef) REQUIRE k.id IS UNIQUE;

CREATE CONSTRAINT tag_name IF NOT EXISTS
FOR (t:Tag) REQUIRE t.name IS UNIQUE;
```

## 5. Indexes

```cypher
CREATE INDEX context_title IF NOT EXISTS
FOR (c:Context) ON (c.title);

CREATE INDEX context_type IF NOT EXISTS
FOR (c:Context) ON (c.type);

CREATE INDEX context_status IF NOT EXISTS
FOR (c:Context) ON (c.status);

CREATE INDEX context_visibility IF NOT EXISTS
FOR (c:Context) ON (c.visibility);

CREATE INDEX raw_context_source IF NOT EXISTS
FOR (r:RawContext) ON (r.sourceType);

CREATE INDEX review_status IF NOT EXISTS
FOR (r:ReviewItem) ON (r.status);
```

## 6. Seed Graph

Seed:

```txt
Organization: Acme AI Lab
Admin: admin@teamgraph.local
Member: member@teamgraph.local
Project: Core Platform
Project: Agent Workflows
Connectors: Slack, GitHub, Drive, Notion, Jira, Teams, Outlook, Docs Upload
Trusted Context:
- Decision: Use Neo4j as the graph brain.
- Decision: P0 uses dummy connectors.
- Decision: Gemini curator should summarize and classify context.
- Task: Build npm MCP CLI.
- Handoff: P0 proves API key → MCP → context upload → curator → graph update.
Pending Review:
- Context containing a possible fake API key example.
Quarantined:
- Example secret-looking context.
```


---

# MCP_NPM_CLI_SPEC.md — @teamgraph/mcp Live Brain CLI

## 1. Package

```txt
packages/teamgraph-mcp
```

Package name:

```txt
@teamgraph/mcp
```

Command:

```txt
teamgraph-mcp
```

## 2. Purpose

The CLI lets external AI agents connect to TeamGraph through MCP and lets users upload context into the live brain.

## 3. Local Install

```bash
cd packages/teamgraph-mcp
npm install
npm run build
npm link
```

## 4. Commands

### Login

```bash
teamgraph-mcp login
```

Prompt:

```txt
TeamGraph server URL:
API key:
Default project:
```

Store:

```txt
~/.teamgraph/config.json
```

### Status

```bash
teamgraph-mcp status
```

Show:

- server URL
- masked API key
- default project
- backend health
- API key validity
- current mode

### Serve MCP

```bash
teamgraph-mcp serve
```

MCP client config:

```json
{
  "mcpServers": {
    "teamgraph": {
      "command": "teamgraph-mcp",
      "args": ["serve"]
    }
  }
}
```

### Get Context

```bash
teamgraph-mcp get-context --query "why did we choose Neo4j"
```

Optional:

```bash
teamgraph-mcp get-context --query "MCP CLI status" --project "Core Platform"
```

### Upload Context

```bash
teamgraph-mcp upload-context --text "Decision: safe context should auto-curate into graph" --project "Core Platform" --type decision --visibility project
```

File upload:

```bash
teamgraph-mcp upload-context --file ./context.md --project "Core Platform"
```

### Optimize

```bash
teamgraph-mcp optimize --project "Core Platform"
```

Calls backend optimizer.

## 5. MCP Tools

### `get_context`

Input:

```json
{
  "query": "why did we choose Neo4j",
  "project": "Core Platform"
}
```

### `search_context_graph`

Input:

```json
{
  "query": "brain curator",
  "limit": 10
}
```

### `get_project_context`

Input:

```json
{
  "project": "Core Platform"
}
```

### `get_user_context`

Input:

```json
{
  "limit": 20
}
```

### `get_handoff_context`

Input:

```json
{
  "project": "Core Platform",
  "currentTask": "continue graph optimizer"
}
```

### `upload_context`

Input:

```json
{
  "title": "Brain curator ingestion flow",
  "type": "decision",
  "project": "Core Platform",
  "content": "New context should become RawContext, then curator decides auto-curate/review/quarantine.",
  "visibility": "project",
  "tags": ["curator", "ingestion"]
}
```

### `optimize_graph`

Input:

```json
{
  "project": "Core Platform"
}
```

### `list_context_sources`

Input:

```json
{
  "project": "Core Platform"
}
```

## 6. Backend Endpoints Used by CLI

```txt
GET  /health
POST /mcp/validate-key
GET  /mcp/tools
POST /mcp/tool/get-context
POST /mcp/tool/upload-context
POST /mcp/tool/optimize-graph
GET  /mcp/tool/sources
```

## 7. Implementation Files

```txt
packages/teamgraph-mcp/
  package.json
  tsconfig.json
  src/
    index.ts
    cli.ts
    config.ts
    apiClient.ts
    mcpServer.ts
    parsers/
      markdown.ts
      json.ts
    tools/
      getContext.ts
      searchContextGraph.ts
      getProjectContext.ts
      getUserContext.ts
      getHandoffContext.ts
      uploadContext.ts
      optimizeGraph.ts
      listContextSources.ts
```

## 8. Upload Format

Markdown frontmatter:

```md
---
title: Brain curator ingestion flow
type: decision
project: Core Platform
visibility: project
tags: [curator, ingestion]
---

New context should become RawContext, then curator decides auto-curate/review/quarantine.
```

JSON:

```json
{
  "title": "Brain curator ingestion flow",
  "type": "decision",
  "project": "Core Platform",
  "content": "New context should become RawContext, then curator decides auto-curate/review/quarantine.",
  "visibility": "project",
  "tags": ["curator", "ingestion"]
}
```


---

# UI_STITCH_DESIGN_BRIEF.md — TeamGraph Live Brain UI

## 1. Design Goal

Design a simple, dark, premium web app for a live organization context brain.

The app should feel like:

- calm
- minimal
- technical
- premium
- graph-native
- trustworthy
- developer-friendly
- not overdone

It should not feel like a generic SaaS template.

## 2. References

Use as inspiration, not copying:

- Award-winning minimal websites: clean hierarchy, spacing, restraint.
- Clean dark websites: high contrast and simple layout.
- Raycast-like productivity polish: command-style workflow, speed, technical clarity.
- Linear-like restraint: subtle borders, quiet cards, confident spacing.
- Cursor-like developer workflow: code/config blocks, AI-agent clarity.

## 3. Visual Style

Colors:

```txt
Background: #07080A, #0B0D10
Cards: #12151A, #171B21
Borders: rgba(255,255,255,0.08)
Text primary: #F5F7FA
Text secondary: #A7AFBC
Muted: #6F7785

Brain/Graph: #7DD3FC
MCP/API: #A78BFA
Safe: #22C55E
Review/Warning: #F59E0B
Unsafe/Revoke: #F43F5E
```

Typography:

- Inter, Geist, or system sans
- restrained headings
- readable body text
- compact uppercase labels
- monospaced code blocks

Motion:

- page fade
- card hover
- graph node pulse
- curator status transition
- API key reveal
- review approval animation

## 4. Pages to Design

1. Landing
2. Login
3. Brain Chat
4. Graph
5. Context Inbox
6. Approvals
7. API Keys
8. Connectors
9. Team
10. Activity/Settings

## 5. Stitch Prompt

Paste this into Stitch MCP:

```txt
Design a dark, minimal, premium web app called TeamGraph AI.

TeamGraph AI is a live organization context brain for humans and AI agents. It ingests context from dummy connectors, MCP uploads, and future workplace tools; stores raw context; uses a Gemini curator to classify safety, summarize, tag, detect duplicates/conflicts, and place context into a Neo4j graph; then lets users chat with the approved graph and lets external AI agents retrieve context through an npm MCP CLI.

The app is not a generic chatbot and not a generic SaaS dashboard. It is a control plane for a live context brain.

Style:
Clean dark UI inspired by award-winning minimal websites, Raycast-like productivity polish, Linear-like restraint, and Cursor-like technical clarity. Do not copy any brand. Use near-black backgrounds, charcoal panels, subtle borders, high-contrast text, clean icons, and restrained accents.

Screens:
1. Landing page with headline: "A live context brain for every teammate and every AI agent." Show architecture: Connectors + MCP Uploads → Raw Context → Gemini Curator → Review/Auto-curate → Neo4j Brain Graph → Brain Chat + MCP Agents.
2. Login page with demo admin/member login.
3. Brain Chat main page with chat area, source-backed answer, related graph nodes, citations, confidence, and timeline side panel.
4. Graph page with Neo4j-style graph visualization, filters for Raw/Curated/Pending/Unsafe/UserGraph/ProjectGraph, selected node details.
5. Context Inbox with lanes: Auto-curated, Pending review, Quarantined, Duplicate/conflict.
6. Approvals page with curator summary, risk tags, proposed graph operations, approve/reject/edit actions.
7. API Keys page with scoped key creation, one-time reveal, revoke, MCP config block.
8. Connectors page with dummy cards for Slack, GitHub, Google Drive, Notion, Jira, Teams, Outlook, Docs Upload.
9. Team page with admin/member access.
10. Activity/settings page with curator runs, MCP calls, graph optimizer status.

Components:
Sidebar, topbar, role badge, brain chat panel, source citation card, graph canvas, node details drawer, context lane board, approval card, API key card, code block, connector card, activity feed.

Make the UI simple, polished, and buildable in Next.js + Tailwind.
```


---

# SAFETY_AND_PERMISSIONS.md — Safety, Access Control, and Curator Harness

## 1. Roles

Only two roles in P0:

```txt
admin
member
```

## 2. Admin Capabilities

Admin can:

- manage team
- manage dummy connectors
- create/revoke any API key
- query brain across org
- view graph
- view all context lanes
- approve/reject/edit review items
- run optimizer
- view activity

## 3. Member Capabilities

Member can:

- query accessible graph context
- create own API key if enabled
- upload context
- use MCP CLI
- view own uploads
- view project context
- cannot approve risky context
- cannot manage team
- cannot manage connectors
- cannot access another user’s private context

## 4. API Key Scopes

```txt
context:read
context:upload
graph:read
mcp:connect
brain:query
optimizer:run
```

P0 default:

- admin keys can get all scopes
- member keys get context:read, context:upload, graph:read, mcp:connect, brain:query

Only admin can run optimizer from UI. CLI optimize requires `optimizer:run`.

## 5. Context Visibility

```txt
private       → uploader + admin only
project       → project users + admin
organization  → organization users + admin
```

## 6. Curator Safety Harness

The model can only produce structured proposal JSON.

Backend validates:

- operation type allowlist
- node type allowlist
- relation type allowlist
- user permissions
- project scope
- visibility
- safety status

## 7. Allowed Operations

```txt
CREATE_CONTEXT
CREATE_TAG
LINK_CONTEXT_TO_PROJECT
LINK_CONTEXT_TO_USER_GRAPH
LINK_RELATED_CONTEXT
MARK_DUPLICATE
MARK_CONFLICT
UPDATE_CONTEXT_SUMMARY
UPDATE_RETRIEVAL_PRIORITY
CREATE_REVIEW_ITEM
QUARANTINE_CONTEXT
SUGGEST_MERGE
```

## 8. Blocked Operations

```txt
DELETE_USER
DELETE_ORGANIZATION
DELETE_PROJECT
DELETE_RAW_CONTEXT
REMOVE_EVIDENCE
CHANGE_PERMISSIONS
REVOKE_API_KEY
RUN_RAW_CYPHER
OVERWRITE_RAW_CONTEXT
AUTO_APPROVE_UNSAFE
```

## 9. Secret Detection

Before model call, check for:

```txt
password=
api_key=
secret=
token=
-----BEGIN PRIVATE KEY-----
sk-
ghp_
xoxb-
```

If matched, force review/quarantine.

## 10. Prompt Injection Detection

Check for:

```txt
ignore previous instructions
forget all previous instructions
system prompt
developer message
reveal your prompt
override policy
```

If matched, force quarantine or review.

## 11. Admin Review Required

Review required for:

- unsafe/sensitive content
- possible secrets
- prompt injection
- conflicts with existing decision
- low quality
- organization-wide context from member
- major decision
- task completion claim
- low confidence curator output

## 12. Auto-curation Allowed

Auto-curate when:

- safe
- quality score >= 0.70
- no conflict
- no secret
- no prompt injection
- project/private visibility
- valid project scope


---

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


---

# DELIVERY_CHECKLIST.md — TeamGraph Live Brain P0

## Root

- [ ] Root docs exist.
- [ ] CONTEXT.md exists.
- [ ] `.env.example` exists.
- [ ] `.gitignore` exists.
- [ ] Docker Compose exists.
- [ ] README complete.

## Neo4j

- [ ] Neo4j starts with Docker Compose.
- [ ] Browser works on 7474.
- [ ] Bolt works on 7687.
- [ ] Constraints created.
- [ ] Seed graph created.
- [ ] RawContext, Context, ReviewItem, CuratorRun, SafetySignal nodes exist.

## Backend

- [ ] FastAPI runs on 8000.
- [ ] Health endpoint works.
- [ ] Demo login works.
- [ ] API key generation works.
- [ ] API key validation works.
- [ ] Context upload creates RawContext.
- [ ] Mock curator works without Gemini key.
- [ ] Gemini curator works if key exists.
- [ ] Safety rules detect obvious secrets/injection.
- [ ] Safe context auto-curates.
- [ ] Risky context enters review.
- [ ] Quarantined context works.
- [ ] Approve/reject/edit approve works.
- [ ] Brain query returns answer + citations.
- [ ] Graph optimizer creates run.
- [ ] MCP backend endpoints work.

## Frontend

- [ ] Landing page polished.
- [ ] Login works.
- [ ] Brain Chat main page works.
- [ ] Graph visualization works.
- [ ] Context Inbox lanes work.
- [ ] Approvals page works.
- [ ] API key page works.
- [ ] Connectors dummy page works.
- [ ] Team roles page works.
- [ ] Activity page works.
- [ ] Settings page shows Neo4j/Gemini mode.
- [ ] UI is dark, clean, simple, premium.
- [ ] No lorem ipsum.
- [ ] No broken navigation.

## MCP CLI

- [ ] package exists.
- [ ] npm install works.
- [ ] npm run build works.
- [ ] npm link works.
- [ ] teamgraph-mcp login works.
- [ ] status works.
- [ ] serve works.
- [ ] get-context works.
- [ ] upload-context works.
- [ ] optimize works if implemented.
- [ ] MCP tools use API key.

## Demo Loop

- [ ] Login admin.
- [ ] Ask Brain Chat “Why did we choose Neo4j?”
- [ ] Create API key.
- [ ] Login CLI.
- [ ] Get context from CLI.
- [ ] Upload context from CLI.
- [ ] Curator runs.
- [ ] Context auto-curates or enters review.
- [ ] Approve risky context.
- [ ] Graph updates.
- [ ] Run optimizer.
- [ ] Brain Chat answers based on new context.

## Git

- [ ] Many meaningful commits.
- [ ] No secrets committed.
- [ ] No `.env` committed.
- [ ] No node_modules committed.
- [ ] No build artifacts committed.
- [ ] CONTEXT.md updated.


---

# CONTEXT.md — TeamGraph Live Brain Handoff

Maintain this file after every major implementation phase.

## Current Status

Not started.

## Completed Work

None yet.

## Architecture

- Frontend: Next.js + TypeScript + Tailwind + React Flow
- Backend: FastAPI
- Graph: Neo4j via Docker Compose
- Curator: Gemini if configured, deterministic mock fallback otherwise
- MCP CLI: TypeScript npm package at `packages/teamgraph-mcp`
- Main app page: Brain Chat
- Safety: model proposals validated by graph harness

## Product Decisions

- P0 uses admin/member roles only.
- P0 uses dummy connectors.
- Neo4j is required.
- RawContext is immutable.
- Safe context can auto-curate.
- Risky context goes to review.
- Unsafe context goes to quarantine.
- Gemini never executes raw Cypher.
- API keys are hashed and scoped.
- External agents connect via npm MCP CLI.
- No hosting in P0.

## Latest Commit

None yet.

## Files Changed

None yet.

## Known Issues

None yet.

## Run Commands

To be filled by implementation agent.

## Next Recommended Steps

1. Initialize repository.
2. Add Neo4j Docker Compose.
3. Build backend scaffold.
4. Seed Neo4j graph.
5. Build curator/mock curator.
6. Build context upload/lane flow.
7. Build MCP CLI.
8. Build frontend.


---

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
