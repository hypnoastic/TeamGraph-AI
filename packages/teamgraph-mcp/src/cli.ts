import fs from 'fs';
import path from 'path';
import os from 'os';

function getClaudeConfigPath() {
    const platform = os.platform();
    if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    } else if (platform === 'win32') {
        return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
    }
    throw new Error('Unsupported platform for Claude Desktop config automatic detection.');
}

export function install(agent: string, apiKey: string) {
    if (agent.toLowerCase() === 'claude') {
        try {
            const configPath = getClaudeConfigPath();
            let config: any = { mcpServers: {} };
            
            if (fs.existsSync(configPath)) {
                try {
                    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (e) {
                    console.error(`Error parsing existing config at ${configPath}. Make sure it is valid JSON.`);
                    return;
                }
            } else {
                // Ensure directory exists
                fs.mkdirSync(path.dirname(configPath), { recursive: true });
            }
            
            if (!config.mcpServers) config.mcpServers = {};
            
            // Add or update teamgraph server
            config.mcpServers['teamgraph-live-brain'] = {
                command: "teamgraph-mcp", // Assumes teamgraph-mcp is linked globally in PATH
                args: [],
                env: {
                    TEAMGRAPH_API_KEY: apiKey,
                    TEAMGRAPH_SERVER_URL: "http://localhost:8000" // Point to local API for P0
                }
            };
            
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log(`Success: teamgraph-mcp successfully installed into Claude Desktop!`);
            console.log(`Config updated at: ${configPath}`);
            console.log(`Please restart Claude Desktop for the changes to take effect.`);
        } catch (e: any) {
            console.error(`Failed to install for Claude: ${e.message}`);
        }
    } else if (agent.toLowerCase() === 'cursor') {
        // Cursor doesn't have a simple JSON file for MCP yet, it's configured in UI or SQLite DB.
        console.log(`\nTo install teamgraph-mcp in Cursor:`);
        console.log(`1. Open Cursor Settings -> Features -> MCP`);
        console.log(`2. Click '+ Add New MCP Server'`);
        console.log(`3. Set Name to: TeamGraph Live Brain`);
        console.log(`4. Set Type to: command`);
        console.log(`5. Set Command to: teamgraph-mcp`);
        console.log(`\nIMPORTANT: Since Cursor doesn't support passing custom env variables in the UI yet,`);
        console.log(`you must set TEAMGRAPH_API_KEY="${apiKey}" in your system environment or shell profile.\n`);
    } else {
        console.error(`Error: Unsupported agent '${agent}'. Currently supported for automatic install: 'claude', 'cursor'.`);
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
            } catch (e) {
                console.error(`Error parsing existing config at ${configPath}. Make sure it is valid JSON.`);
                return;
            }
            
            if (config.mcpServers && config.mcpServers['teamgraph-live-brain']) {
                delete config.mcpServers['teamgraph-live-brain'];
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
                console.log(`Success: teamgraph-mcp successfully uninstalled from Claude Desktop.`);
                console.log(`Please restart Claude Desktop for the changes to take effect.`);
            } else {
                console.log(`TeamGraph MCP was not installed in Claude Desktop. Nothing to do.`);
            }
        } catch (e: any) {
            console.error(`Failed to uninstall for Claude: ${e.message}`);
        }
    } else {
        console.error(`Error: Unsupported agent '${agent}'. Currently supported for automatic uninstall: 'claude'.`);
    }
}
