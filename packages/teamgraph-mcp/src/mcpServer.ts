import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { getApiClient } from './apiClient';

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
    tools: [
      {
        name: 'get_context',
        description: 'Get context from TeamGraph Live Brain by query',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            project: { type: 'string' }
          },
          required: ['query']
        }
      },
      {
        name: 'upload_context',
        description: 'Upload new context to TeamGraph',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string' },
            project: { type: 'string' },
            visibility: { type: 'string' }
          },
          required: ['title', 'content']
        }
      },
      {
        name: 'optimize_graph',
        description: 'Optimize the brain graph',
        inputSchema: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = getApiClient();
  
  try {
    if (request.params.name === 'get_context') {
      const res = await client.post('/mcp/tool/get-context', request.params.arguments);
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    }
    
    if (request.params.name === 'upload_context') {
      const res = await client.post('/mcp/tool/upload-context', request.params.arguments);
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    }

    if (request.params.name === 'optimize_graph') {
      const res = await client.post('/mcp/tool/optimize-graph');
      return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
    }

    throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
  } catch (error: any) {
    return {
      content: [{ type: 'text', text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

export async function runMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('TeamGraph MCP server running on stdio');
}
