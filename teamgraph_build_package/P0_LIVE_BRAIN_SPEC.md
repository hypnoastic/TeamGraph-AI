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
