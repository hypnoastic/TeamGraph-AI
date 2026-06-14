#!/usr/bin/env node

import { runMcpServer } from './mcpServer';
import { install, uninstall } from './cli';

const args = process.argv.slice(2);

if (args.length === 0) {
  // Default behavior: start MCP server (used by AI Agents behind the scenes)
  runMcpServer().catch(console.error);
} else {
  const command = args[0];
  
  if (command === 'install') {
    const target = args[1];
    let apiKey = '';
    
    // Parse api="xxxx"
    for (let i = 2; i < args.length; i++) {
        if (args[i].startsWith('api=')) {
            apiKey = args[i].substring(4);
        }
    }
    
    if (!target) {
        console.error("Error: Missing target agent (e.g. claude).");
        process.exit(1);
    }
    if (!apiKey) {
        console.error("Error: Missing api key. Use format api=\"xxxx\"");
        process.exit(1);
    }
    
    install(target, apiKey);
  } 
  
  else if (command === 'uninstall') {
    const target = args[1];
    if (!target) {
        console.error("Error: Missing target agent (e.g. claude).");
        process.exit(1);
    }
    uninstall(target);
  } 
  
  else {
    console.error(`Unknown command: ${command}`);
    console.error("Usage:");
    console.error("  teamgraph-mcp                       (Starts the MCP server)");
    console.error("  teamgraph-mcp install <agent> api=\"<key>\" (Installs to agent)");
    console.error("  teamgraph-mcp uninstall <agent>     (Removes from agent)");
    process.exit(1);
  }
}
