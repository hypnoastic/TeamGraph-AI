# MCP_NPM_CLI_SPEC.md

## Package

- Package: `@teamgraph/mcp`
- Binary: `teamgraph-mcp`

## Purpose

The CLI is the public agent interface for TeamGraph. It does not expose Graphiti directly. Every command and MCP tool calls the TeamGraph backend, which enforces scopes, project access, and approval rules before touching the live brain.

## Direct Commands

```bash
teamgraph-mcp login --api-key <key> [--server-url http://localhost:8000]
teamgraph-mcp status
teamgraph-mcp serve
teamgraph-mcp get-context --query "..." [--project "Core Platform"]
teamgraph-mcp upload-context --text "..." --project "Core Platform"
teamgraph-mcp upload-context --file ./context.md --project "Core Platform"
teamgraph-mcp list-context-sources
teamgraph-mcp optimize-graph
```

## Stored Config

- File: `~/.teamgraph-mcp.json`
- Fields:
  - `apiKey`
  - `serverUrl`

Environment variables still override saved config:

- `TEAMGRAPH_API_KEY`
- `TEAMGRAPH_SERVER_URL`

## MCP Tools

- `get_context`
- `search_context_graph`
- `get_project_context`
- `get_user_context`
- `get_handoff_context`
- `upload_context`
- `list_context_sources`
- `optimize_graph`

## Backend Endpoints

- `POST /mcp/validate-key`
- `GET /mcp/tools`
- `POST /mcp/tool/get-context`
- `POST /mcp/tool/search-context-graph`
- `POST /mcp/tool/get-project-context`
- `POST /mcp/tool/get-user-context`
- `POST /mcp/tool/get-handoff-context`
- `POST /mcp/tool/upload-context`
- `GET /mcp/tool/list-context-sources`
- `POST /mcp/tool/optimize-graph`

## Security Rules

- API keys must be hashed in storage.
- The CLI never talks to Neo4j or Graphiti directly.
- Every MCP tool call must include a valid TeamGraph API key.
- TeamGraph enforces scopes such as `context.read`, `context.write`, and `graph.optimize`.

## Claude Installation

```bash
teamgraph-mcp install claude api="<key>"
```

This writes a Claude Desktop MCP server entry that launches:

```txt
teamgraph-mcp serve
```
