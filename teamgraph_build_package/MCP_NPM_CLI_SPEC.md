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
