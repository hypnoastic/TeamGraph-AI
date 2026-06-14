import axios from 'axios';

export function getApiClient() {
  const apiKey = process.env.TEAMGRAPH_API_KEY;
  const serverUrl = process.env.TEAMGRAPH_SERVER_URL || 'http://localhost:8000';

  if (!apiKey) {
    throw new Error('TEAMGRAPH_API_KEY environment variable is not set. Please make sure the MCP server is launched with this variable.');
  }

  return axios.create({
    baseURL: serverUrl,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}
