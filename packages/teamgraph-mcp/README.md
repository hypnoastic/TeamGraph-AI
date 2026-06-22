# @teamgraph/mcp

MCP server and CLI for the TeamGraph AI organization brain.

## Install

```bash
npm install -g @teamgraph/mcp
teamgraph-mcp login --api-key tg_live_xxx --server-url https://api.example.com
teamgraph-mcp status
teamgraph-mcp serve
```

The local config is stored at `~/.teamgraph-mcp.json` with owner-only permissions. `TEAMGRAPH_API_KEY` and `TEAMGRAPH_SERVER_URL` override that file.

## CLI

```bash
teamgraph-mcp get-context --query "What changed?" --project "Core Platform"
teamgraph-mcp upload-context --text "Decision: ship v2" --project "Core Platform"
teamgraph-mcp upload-context --file ./handoff.md --project "Core Platform"
teamgraph-mcp list-projects
teamgraph-mcp list-context-sources
```

## MCP client config

```json
{
  "mcpServers": {
    "teamgraph": {
      "command": "teamgraph-mcp",
      "args": ["serve"],
      "env": {
        "TEAMGRAPH_API_KEY": "tg_live_xxx",
        "TEAMGRAPH_SERVER_URL": "https://api.example.com"
      }
    }
  }
}
```

Tools: `get_context`, `search_context_graph`, `get_project_context`, `get_user_context`, `get_handoff_context`, `upload_context`, `list_context_sources`, `list_projects`, and `optimize_graph`.
