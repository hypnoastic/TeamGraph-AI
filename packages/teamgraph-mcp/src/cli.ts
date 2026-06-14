import fs from 'fs';
import os from 'os';
import path from 'path';

import { getApiClient, resolveConfig } from './apiClient';
import { getConfigPath, writeConfig } from './configStore';

function parseOption(args: string[], name: string): string | undefined {
  const flag = `--${name}`;
  const index = args.indexOf(flag);
  if (index >= 0 && args[index + 1]) return args[index + 1];

  const prefix = `${flag}=`;
  const value = args.find((arg) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : undefined;
}

function getClaudeConfigPath() {
  const platform = os.platform();
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  }
  if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  }
  throw new Error('Unsupported platform for Claude Desktop config automatic detection.');
}

export async function login(args: string[]) {
  const apiKey = parseOption(args, 'api-key') || process.env.TEAMGRAPH_API_KEY;
  const serverUrl = parseOption(args, 'server-url') || process.env.TEAMGRAPH_SERVER_URL || 'http://localhost:8000';

  if (!apiKey) {
    console.error('Missing API key. Use `teamgraph-mcp login --api-key <key> [--server-url <url>]`.');
    process.exit(1);
  }

  writeConfig({ apiKey, serverUrl });
  console.log(`Saved TeamGraph MCP config to ${getConfigPath()}`);
  console.log(`Server URL: ${serverUrl}`);
}

export async function status() {
  try {
    const config = resolveConfig();
    const client = getApiClient();
    const response = await client.post('/mcp/validate-key');
    console.log(JSON.stringify({ config, validation: response.data }, null, 2));
  } catch (error: any) {
    console.error(`Status check failed: ${error.message}`);
    process.exit(1);
  }
}

export async function getContext(args: string[]) {
  const query = parseOption(args, 'query');
  const project = parseOption(args, 'project');
  if (!query) {
    console.error('Missing query. Use `teamgraph-mcp get-context --query "..." [--project "..."]`.');
    process.exit(1);
  }

  const client = getApiClient();
  const response = await client.post('/mcp/tool/get-context', { query, project });
  console.log(JSON.stringify(response.data, null, 2));
}

export async function listContextSources() {
  const client = getApiClient();
  const response = await client.get('/mcp/tool/list-context-sources');
  console.log(JSON.stringify(response.data, null, 2));
}

export async function uploadContext(args: string[]) {
  const text = parseOption(args, 'text');
  const file = parseOption(args, 'file');
  const project = parseOption(args, 'project');
  const title = parseOption(args, 'title') || 'CLI Context Upload';

  if (!text && !file) {
    console.error('Provide `--text` or `--file` for upload-context.');
    process.exit(1);
  }

  const content = text || fs.readFileSync(path.resolve(file as string), 'utf8');
  const client = getApiClient();
  const response = await client.post('/mcp/tool/upload-context', {
    title,
    content,
    project,
    source: 'cli',
    sourceType: file ? 'file_upload' : 'mcp_upload',
    upload_channel: 'mcp',
  });
  console.log(JSON.stringify(response.data, null, 2));
}

export async function optimizeGraph() {
  const client = getApiClient();
  const response = await client.post('/mcp/tool/optimize-graph');
  console.log(JSON.stringify(response.data, null, 2));
}

export function install(agent: string, apiKey: string) {
  if (agent.toLowerCase() === 'claude') {
    try {
      const configPath = getClaudeConfigPath();
      let config: any = { mcpServers: {} };

      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {
          console.error(`Error parsing existing config at ${configPath}. Make sure it is valid JSON.`);
          return;
        }
      } else {
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
      }

      if (!config.mcpServers) config.mcpServers = {};

      config.mcpServers['teamgraph-live-brain'] = {
        command: 'teamgraph-mcp',
        args: ['serve'],
        env: {
          TEAMGRAPH_API_KEY: apiKey,
          TEAMGRAPH_SERVER_URL: 'http://localhost:8000',
        },
      };

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('Success: teamgraph-mcp successfully installed into Claude Desktop.');
      console.log(`Config updated at: ${configPath}`);
      console.log('Please restart Claude Desktop for the changes to take effect.');
    } catch (error: any) {
      console.error(`Failed to install for Claude: ${error.message}`);
    }
  } else if (agent.toLowerCase() === 'cursor') {
    console.log('\nTo install teamgraph-mcp in Cursor:');
    console.log('1. Open Cursor Settings -> Features -> MCP');
    console.log("2. Click '+ Add New MCP Server'");
    console.log('3. Set Name to: TeamGraph Live Brain');
    console.log('4. Set Type to: command');
    console.log('5. Set Command to: teamgraph-mcp serve');
    console.log(
      `\nSet TEAMGRAPH_API_KEY="${apiKey}" and TEAMGRAPH_SERVER_URL="http://localhost:8000" in your shell environment.\n`
    );
  } else {
    console.error(`Error: Unsupported agent '${agent}'.`);
  }
}

export function uninstall(agent: string) {
  if (agent.toLowerCase() === 'claude') {
    try {
      const configPath = getClaudeConfigPath();

      if (!fs.existsSync(configPath)) {
        console.log(`Config file not found at ${configPath}. Nothing to uninstall.`);
        return;
      }

      let config: any;
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch {
        console.error(`Error parsing existing config at ${configPath}. Make sure it is valid JSON.`);
        return;
      }

      if (config.mcpServers && config.mcpServers['teamgraph-live-brain']) {
        delete config.mcpServers['teamgraph-live-brain'];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('Success: teamgraph-mcp successfully uninstalled from Claude Desktop.');
        console.log('Please restart Claude Desktop for the changes to take effect.');
      } else {
        console.log('TeamGraph MCP was not installed in Claude Desktop. Nothing to do.');
      }
    } catch (error: any) {
      console.error(`Failed to uninstall for Claude: ${error.message}`);
    }
  } else {
    console.error(`Error: Unsupported agent '${agent}'.`);
  }
}

export function printUsage() {
  console.error('Usage:');
  console.error('  teamgraph-mcp serve');
  console.error('  teamgraph-mcp login --api-key <key> [--server-url <url>]');
  console.error('  teamgraph-mcp status');
  console.error('  teamgraph-mcp get-context --query "<text>" [--project "<name>"]');
  console.error('  teamgraph-mcp upload-context --text "<text>" --project "<name>" [--title "<name>"]');
  console.error('  teamgraph-mcp upload-context --file ./context.md --project "<name>" [--title "<name>"]');
  console.error('  teamgraph-mcp list-context-sources');
  console.error('  teamgraph-mcp optimize-graph');
  console.error('  teamgraph-mcp install <agent> api="<key>"');
  console.error('  teamgraph-mcp uninstall <agent>');
}
