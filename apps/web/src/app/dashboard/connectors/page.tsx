"use client";

import { Plug, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet, apiPost } from "@/lib/api";
import type { ConnectorRecord } from "@/lib/types";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const refresh = () => {
    apiGet<{ connectors: ConnectorRecord[] }>("/connectors")
      .then((data) => setConnectors(data.connectors))
      .catch(() => setConnectors([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleConnect = async (provider: string) => {
    setLoading(provider);
    try {
      await apiPost(`/connectors/${provider}/connect`);
      refresh();
    } catch (e) {
      alert("Failed to connect: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoading(provider);
    try {
      await apiPost(`/connectors/${provider}/disconnect`);
      refresh();
    } catch (e) {
      alert("Failed to disconnect: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(null);
    }
  };

  return (
    <PageShell title="Connectors" description="Enable sync adapters to import workplace data dynamically.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connectors.map((connector, index) => {
          const isConnected = connector.state === "connected";
          const isConfigured = connector.state === "configured";

          let statusBadge = <span className="badge">Soon</span>;
          if (isConnected) {
            statusBadge = (
              <span className="badge badge-safe flex items-center gap-1">
                <CheckCircle2 size={12} /> Active
              </span>
            );
          } else if (isConfigured) {
            statusBadge = <span className="badge badge-review">Ready</span>;
          }

          return (
            <article
              key={connector.key}
              className={`panel p-5 flex flex-col justify-between min-h-[250px] ${
                ["bg-[var(--yellow)]", "bg-[var(--cyan)]", "bg-[var(--lime)]", "bg-[var(--coral)]"][index % 4]
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <Plug size={24} />
                  {statusBadge}
                </div>
                <h2 className="mt-6 text-xl font-black">{connector.name}</h2>
                <p className="mt-2 text-sm leading-relaxed">{connector.description}</p>
              </div>

              <div className="mt-5 space-y-3">
                <div className="text-xs font-mono font-black uppercase tracking-wider opacity-70">
                  {connector.todo}
                </div>

                {isConnected ? (
                  <button
                    disabled={loading !== null}
                    onClick={() => handleDisconnect(connector.key)}
                    className="btn-secondary w-full text-xs font-black py-1.5 shadow-[2px_2px_0_black]"
                  >
                    {loading === connector.key ? "Disconnecting..." : "Disconnect"}
                  </button>
                ) : isConfigured ? (
                  <button
                    disabled={loading !== null}
                    onClick={() => handleConnect(connector.key)}
                    className="btn-primary w-full text-xs font-black py-1.5"
                  >
                    {loading === connector.key ? "Connecting..." : "Connect"}
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-secondary w-full text-xs font-black py-1.5 opacity-55 cursor-not-allowed transform-none shadow-none"
                    title="Define credentials in .env to connect."
                  >
                    Keys Required
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
