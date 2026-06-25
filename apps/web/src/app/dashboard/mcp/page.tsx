"use client";

import { useEffect, useState } from "react";
import { Copy, Terminal, Link as LinkIcon, Check, ShieldAlert } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { ApiKeyRecord } from "@/lib/types";
import Link from "next/link";

export default function McpPage() {
  const [apiKey, setApiKey] = useState<string>("");
  const [hasKeys, setHasKeys] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:8000");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  useEffect(() => {
    // Dynamically calculate local/production API URL
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      // In development, Next.js runs on port 3000 and FastAPI on 8000
      const port = window.location.port === "3000" ? "8000" : window.location.port;
      const url = `${protocol}//${hostname}${port ? `:${port}` : ""}`;
      setApiUrl(url);
    }

    // Try fetching existing keys to see if they have one
    apiGet<ApiKeyRecord[]>("/api-keys/")
      .then((data) => {
        if (data && data.length > 0) {
          setHasKeys(true);
          // Just use the first key prefix as a hint
          setApiKey(data[0].key_prefix + "••••••••••••••••");
        }
      })
      .catch(() => {
        setHasKeys(false);
      });
  }, []);

  const commands = [
    "npm install -g teamgraph",
    `teamgraph login --api-key ${hasKeys ? "tg_live_xxx" : "<your_api_key>"} --server-url ${apiUrl}`,
    "teamgraph status",
    "teamgraph serve",
  ];

  const clientConfig = `{
  "mcpServers": {
    "teamgraph-live-brain": {
      "command": "teamgraph",
      "args": ["serve"],
      "env": {
        "TEAMGRAPH_SERVER_URL": "${apiUrl}",
        "TEAMGRAPH_API_KEY": "${hasKeys ? "tg_live_xxx" : "<your_api_key>"}"
      }
    }
  }
}`;

  const handleCopyCommand = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(clientConfig);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <PageShell title="MCP Setup" description="Integrate Claude Desktop, Cursor, or other agents with the TeamGraph live context brain.">
      <div className="mb-6 flex flex-wrap gap-4 items-center justify-between panel bg-[var(--surface)] p-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="text-[var(--purple)]" size={18} />
          <span className="font-bold text-sm">Need public shareable docs?</span>
        </div>
        <Link href="/docs" target="_blank" className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold">
          View Public Documentation <LinkIcon size={12} />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Commands Panel */}
        <div className="panel bg-[var(--paper)] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Terminal size={24} className="text-black" />
              <h2 className="text-xl font-black">Install & Start the CLI</h2>
            </div>
            
            {!hasKeys && (
              <div className="mt-4 flex items-start gap-2 border border-black bg-[var(--yellow)] p-3 text-xs font-bold leading-relaxed">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <div>
                  No API Key detected. Go to{" "}
                  <Link href="/dashboard/api-keys" className="underline hover:text-[var(--purple)]">
                    API Keys
                  </Link>{" "}
                  first to generate a key for your MCP agent.
                </div>
              </div>
            )}

            <ol className="mt-6 space-y-4">
              {commands.map((command, index) => (
                <li key={command} className="flex flex-col gap-1 border-b border-black/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--muted)] font-black uppercase tracking-wider">
                      Step {index + 1}
                    </span>
                    <button
                      onClick={() => handleCopyCommand(command, index)}
                      className="text-xs flex items-center gap-1 font-bold text-[var(--muted)] hover:text-black transition-colors"
                      title="Copy command"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check size={12} className="text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy
                        </>
                      )}
                    </button>
                  </div>
                  <code className="mono text-sm font-bold bg-white/60 p-2 border border-black/10 select-all break-all mt-1">
                    {command}
                  </code>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 pt-4 border-t-2 border-black/20 text-xs text-[var(--muted)]">
            <p className="font-medium">
              💡 <strong>Tip:</strong> You can also automatically configure Claude Desktop by running:
            </p>
            <code className="mono block bg-white/80 p-2 border border-black/10 mt-1 select-all font-bold">
              {`teamgraph install claude api="${hasKeys ? "tg_live_xxx" : "<your_api_key>"}"`}
            </code>
          </div>
        </div>

        {/* Client Config Panel */}
        <div className="panel overflow-hidden bg-black text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b-2 border-white/20 p-4 bg-zinc-900">
              <span className="font-black text-sm tracking-wide">Client Configuration (JSON)</span>
              <button
                onClick={handleCopyConfig}
                className="text-xs flex items-center gap-1.5 font-bold hover:text-[var(--lime)] transition-colors text-white"
              >
                {copiedConfig ? (
                  <>
                    <Check size={14} className="text-[var(--lime)]" /> Config Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Config
                  </>
                )}
              </button>
            </div>
            <pre className="mono overflow-x-auto p-5 text-xs leading-6 text-[var(--lime)] select-all font-bold">
              {clientConfig}
            </pre>
          </div>

          <div className="p-5 border-t border-white/10 bg-zinc-900 text-xs text-zinc-400 leading-relaxed">
            <span className="text-white font-bold block mb-1">Configuration Keys:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <code className="text-[var(--cyan)]">TEAMGRAPH_SERVER_URL</code>: Set to your TeamGraph API server address.
              </li>
              <li>
                <code className="text-[var(--cyan)]">TEAMGRAPH_API_KEY</code>: Your active team agent key.
              </li>
              <li className="text-zinc-500">
                Note: Both <code className="text-zinc-400">TEAMGRAPH_SERVER_URL</code> and <code className="text-zinc-400">TEAMGRAPH_URL</code> are supported internally.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
