import { Copy, Terminal } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const commands = [
  "npm install -g @teamgraph/mcp",
  "teamgraph-mcp login",
  "teamgraph-mcp status",
  "teamgraph-mcp serve",
];

export default function McpPage() {
  return (
    <PageShell title="MCP setup" description="Connect Claude, Cursor, or another MCP client.">
      <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <div className="panel bg-[var(--yellow)] p-6">
          <Terminal size={30} />
          <h2 className="mt-4 text-2xl font-black">Install the CLI</h2>
          <ol className="mt-5 space-y-3">
            {commands.map((command, index) => <li key={command} className="flex gap-3"><b>{index + 1}.</b><code className="mono text-sm">{command}</code></li>)}
          </ol>
        </div>
        <div className="panel overflow-hidden bg-black text-white">
          <div className="flex items-center justify-between border-b-2 border-white p-4"><b>Client config</b><Copy size={16} /></div>
          <pre className="mono overflow-x-auto p-5 text-xs leading-6 text-[var(--lime)]">{`{
  "mcpServers": {
    "teamgraph": {
      "command": "teamgraph-mcp",
      "args": ["serve"],
      "env": {
        "TEAMGRAPH_URL": "https://your-api.example.com",
        "TEAMGRAPH_API_KEY": "tg_live_..."
      }
    }
  }
}`}</pre>
        </div>
      </div>
    </PageShell>
  );
}
