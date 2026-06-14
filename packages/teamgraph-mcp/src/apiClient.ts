import axios from 'axios';

import { readConfig } from './configStore';
import type { TeamGraphCliConfig } from './types';

export function resolveConfig(): TeamGraphCliConfig {
  const config = readConfig();
  const apiKey = process.env.TEAMGRAPH_API_KEY || config?.apiKey;
  const serverUrl = process.env.TEAMGRAPH_SERVER_URL || config?.serverUrl || 'http://localhost:8000';

  if (!apiKey) {
    throw new Error(
      'TEAMGRAPH_API_KEY is not configured. Run `teamgraph-mcp login --api-key <key>` or set TEAMGRAPH_API_KEY.'
    );
  }

  return { apiKey, serverUrl };
}

export function getApiClient() {
  const config = resolveConfig();
  return axios.create({
    baseURL: config.serverUrl,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}
