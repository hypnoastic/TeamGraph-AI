import fs from 'fs';
import os from 'os';
import path from 'path';

import type { TeamGraphCliConfig } from './types';

const CONFIG_PATH = path.join(os.homedir(), '.teamgraph-mcp.json');

export function readConfig(): TeamGraphCliConfig | null {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as TeamGraphCliConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: TeamGraphCliConfig) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getConfigPath() {
  return CONFIG_PATH;
}
