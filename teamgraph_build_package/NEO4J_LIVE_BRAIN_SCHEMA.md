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
