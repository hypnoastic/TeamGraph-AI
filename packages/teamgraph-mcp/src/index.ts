#!/usr/bin/env node

import { runMcpServer } from './mcpServer';
import {
  getContext,
  install,
  listContextSources,
  login,
  optimizeGraph,
  printUsage,
  status,
  uninstall,
  uploadContext,
} from './cli';

const args = process.argv.slice(2);

async function main() {
  if (args.length === 0 || args[0] === 'serve') {
    await runMcpServer();
    return;
  }

  const [command, ...commandArgs] = args;

  if (command === 'login') {
    await login(commandArgs);
    return;
  }

  if (command === 'status') {
    await status();
    return;
  }

  if (command === 'get-context') {
    await getContext(commandArgs);
    return;
  }

  if (command === 'upload-context') {
    await uploadContext(commandArgs);
    return;
  }

  if (command === 'list-context-sources') {
    await listContextSources();
    return;
  }

  if (command === 'optimize-graph') {
    await optimizeGraph();
    return;
  }

  if (command === 'install') {
    const target = commandArgs[0];
    const apiArg = commandArgs.find((arg) => arg.startsWith('api='));
    const apiKey = apiArg ? apiArg.slice(4) : '';

    if (!target) {
      console.error('Error: Missing target agent (e.g. claude).');
      process.exit(1);
    }
    if (!apiKey) {
      console.error('Error: Missing api key. Use format api="<key>"');
      process.exit(1);
    }

    install(target, apiKey);
    return;
  }

  if (command === 'uninstall') {
    const target = commandArgs[0];
    if (!target) {
      console.error('Error: Missing target agent (e.g. claude).');
      process.exit(1);
    }
    uninstall(target);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
