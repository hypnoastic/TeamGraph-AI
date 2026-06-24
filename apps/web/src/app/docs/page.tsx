"use client";

import { useState, useEffect } from "react";
import { Copy, Terminal, Check, Key, Settings, HelpCircle, ArrowLeft, PlayCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function PublicDocsPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:8000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port === "3000" ? "8000" : window.location.port;
      setApiUrl(`${protocol}//${hostname}${port ? `:${port}` : ""}`);
    }
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const configExample = `{
  "mcpServers": {
    "teamgraph-live-brain": {
      "command": "teamgraph-mcp",
      "args": ["serve"],
      "env": {
        "TEAMGRAPH_SERVER_URL": "${apiUrl}",
        "TEAMGRAPH_API_KEY": "tg_live_your_actual_api_key_here"
      }
    }
  }
}`;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-black selection:bg-[var(--yellow)] pb-16">
      {/* Header Bar */}
      <nav className="flex h-16 items-center justify-between border-b-2 border-black bg-[var(--surface)] px-5 md:px-10">
        <Link href="/" className="text-xl font-black tracking-[-.05em] flex items-center gap-2">
          TEAMGRAPH<span className="text-[var(--purple)]">.</span>
          <span className="text-xs uppercase bg-black text-white px-2 py-0.5 font-bold tracking-widest rounded-sm">Docs</span>
        </Link>
        <Link href="/login" className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5">
          <ArrowLeft size={14} /> Return to Login
        </Link>
      </nav>

      {/* Hero Header */}
      <header className="max-w-4xl mx-auto px-5 pt-10 text-center space-y-3">
        <span className="badge badge-live">Model Context Protocol</span>
        <h1 className="text-4xl md:text-6xl font-black tracking-[-.06em]">Connecting Your AI Agent</h1>
        <p className="max-w-xl mx-auto text-sm md:text-base text-[var(--muted)] font-medium leading-relaxed">
          Follow this 4-step setup guide to connect Claude Desktop, Cursor, or other agents to the TeamGraph live organizational brain.
        </p>
      </header>

      {/* Step Sequence Container */}
      <main className="max-w-4xl mx-auto px-5 mt-10 space-y-8">
        
        {/* STEP 1: Generate Key */}
        <section className="panel bg-[var(--surface)] p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[var(--yellow)] font-black text-lg shadow-[2px_2px_0_black]">
              1
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                Generate your API Key
              </h2>
              <p className="text-sm text-[var(--muted)] font-medium mt-1">
                To authorize your local MCP client to query the graph, you need a scoped API key.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-[var(--paper)] p-4 border-2 border-black">
                <Key className="text-[var(--purple)] shrink-0" size={20} />
                <div className="text-xs font-medium leading-normal">
                  <strong>Instructions:</strong> Sign in, navigate to <strong>API Keys</strong> in the dashboard, and create a key with the <code className="mono bg-white border border-black/10 px-1">context.read</code> and <code className="mono bg-white border border-black/10 px-1">context.write</code> scopes. Make sure to copy the raw key!
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 2: Install CLI */}
        <section className="panel bg-[var(--surface)] p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[var(--cyan)] font-black text-lg shadow-[2px_2px_0_black]">
              2
            </div>
            <div className="w-full">
              <h2 className="text-xl font-black">Install the MCP Package</h2>
              <p className="text-sm text-[var(--muted)] font-medium mt-1">
                Install the TeamGraph MCP CLI executable globally on your system.
              </p>
              
              <div className="mt-4 flex items-center justify-between bg-black text-white p-3 border-2 border-black font-bold text-xs md:text-sm">
                <code className="mono text-[var(--lime)] select-all">npm install -g @teamgraph/mcp</code>
                <button
                  onClick={() => handleCopy("npm install -g @teamgraph/mcp", "npm-install")}
                  className="text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-3"
                >
                  {copiedId === "npm-install" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 3: Config Setup */}
        <section className="panel bg-[var(--surface)] p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[var(--purple)] text-white font-black text-lg shadow-[2px_2px_0_black]">
              3
            </div>
            <div className="w-full">
              <h2 className="text-xl font-black">Add Server Config</h2>
              <p className="text-sm text-[var(--muted)] font-medium mt-1">
                Add TeamGraph to your agent client configurations.
              </p>

              {/* TABS FOR CLIENTS */}
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-sm font-black mb-2 text-[var(--muted)] uppercase tracking-wider">Option A: Claude Desktop</h4>
                  <p className="text-xs text-[var(--muted)] font-medium mb-2">
                    Open your configuration file at:
                    <br />
                    <code className="mono block bg-zinc-100 p-1 border border-black/10 mt-1 select-all break-all">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                  </p>
                  
                  <div className="panel overflow-hidden bg-black text-white">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs bg-zinc-900">
                      <span className="mono">claude_desktop_config.json</span>
                      <button
                        onClick={() => handleCopy(configExample, "config-json")}
                        className="text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedId === "config-json" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />} Copy JSON
                      </button>
                    </div>
                    <pre className="mono p-4 text-[10px] sm:text-xs text-[var(--lime)] font-bold overflow-x-auto select-all">{configExample}</pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10">
                  <h4 className="text-sm font-black mb-2 text-[var(--muted)] uppercase tracking-wider">Option B: Cursor</h4>
                  <ol className="list-decimal pl-4 space-y-1 text-xs font-medium">
                    <li>Navigate to <strong>Cursor Settings &gt; Features &gt; MCP</strong>.</li>
                    <li>Click <strong>+ Add New MCP Server</strong>.</li>
                    <li>Set Name: <code className="mono font-bold bg-white px-1">TeamGraph</code>, Type: <code className="mono font-bold bg-white px-1">command</code>.</li>
                    <li>Command: <code className="mono font-bold bg-white px-1 select-all">teamgraph-mcp serve</code></li>
                    <li>
                      Add Environment Variables:
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        <li>Name: <code className="mono text-[var(--purple)] font-bold">TEAMGRAPH_SERVER_URL</code>, Value: <code className="mono font-bold">{apiUrl}</code></li>
                        <li>Name: <code className="mono text-[var(--purple)] font-bold">TEAMGRAPH_API_KEY</code>, Value: <code className="mono font-bold">YOUR_API_KEY</code></li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 4: Test Connection */}
        <section className="panel bg-[var(--surface)] p-6 md:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-[var(--lime)] font-black text-lg shadow-[2px_2px_0_black]">
              4
            </div>
            <div className="w-full">
              <h2 className="text-xl font-black">Test that it works</h2>
              <p className="text-sm text-[var(--muted)] font-medium mt-1">
                Execute a connection test to confirm validation and connectivity from your terminal.
              </p>

              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--muted)] mb-1">1. Run Login Authentication test</h4>
                  <div className="flex items-center justify-between bg-black text-white p-3 border-2 border-black font-bold text-xs select-all">
                    <code className="mono text-[var(--lime)]">{`teamgraph-mcp login --api-key tg_live_xxx --server-url ${apiUrl}`}</code>
                    <button
                      onClick={() => handleCopy(`teamgraph-mcp login --api-key tg_live_xxx --server-url ${apiUrl}`, "test-login")}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-3"
                    >
                      {copiedId === "test-login" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-[var(--muted)] mb-1">2. Run Connection Status test</h4>
                  <div className="flex items-center justify-between bg-black text-white p-3 border-2 border-black font-bold text-xs select-all">
                    <code className="mono text-[var(--lime)]">teamgraph-mcp status</code>
                    <button
                      onClick={() => handleCopy("teamgraph-mcp status", "test-status")}
                      className="text-zinc-400 hover:text-white flex items-center gap-1 shrink-0 ml-3"
                    >
                      {copiedId === "test-status" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--muted)] font-medium mt-2 leading-relaxed">
                    If correctly connected, this returns a <code className="mono bg-white px-1">"validation": {"{"} "status": "valid" {"}"}</code> confirmation output payload.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-5 mt-16 text-center text-xs text-[var(--muted)] font-medium">
        <p>TeamGraph AI &copy; 2026. Built with Graphiti + Neo4j.</p>
      </footer>
    </div>
  );
}
