import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getApiClient } from './apiClient';

const TOOL_DEFINITIONS = [
  {
    name: 'get_context',
    description: 'Get live TeamGraph brain context for a query.',
    route: '/mcp/tool/get-context',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        project: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_context_graph',
    description: 'Search the TeamGraph live brain graph.',
    route: '/mcp/tool/search-context-graph',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        project: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_project_context',
    description: 'Get project-scoped context for a TeamGraph project.',
    route: '/mcp/tool/get-project-context',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string' },
      },
      required: ['project'],
    },
  },
  {
    name: 'get_user_context',
    description: 'Get user-scoped TeamGraph context.',
    route: '/mcp/tool/get-user-context',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string' },
        query: { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'get_handoff_context',
    description: 'Get handoff context for a query.',
    route: '/mcp/tool/get-handoff-context',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'upload_context',
    description: 'Upload context into TeamGraph for curation and ingestion.',
    route: '/mcp/tool/upload-context',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        project: { type: 'string' },
        source: { type: 'string' },
        sourceType: { type: 'string' },
        visibility: { type: 'string' },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'list_context_sources',
    description: 'List available TeamGraph context source types.',
    route: '/mcp/tool/list-context-sources',
    method: 'get',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'optimize_graph',
    description: 'Run TeamGraph graph optimization.',
    route: '/mcp/tool/optimize-graph',
    method: 'post',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
] as const;

const server = new Server(
  {
    name: 'teamgraph-live-brain',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOL_DEFINITIONS.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = getApiClient();

  try {
    const tool = TOOL_DEFINITIONS.find((candidate) => candidate.name === request.params.name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }

    const payload = request.params.arguments ?? {};
    const response =
      tool.method === 'get' ? await client.get(tool.route) : await client.post(tool.route, payload);

    return {
      content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message ||
      'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
});

export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TeamGraph MCP server running on stdio');
}
