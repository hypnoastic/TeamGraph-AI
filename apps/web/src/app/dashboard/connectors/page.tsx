"use client";

import { Plug } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { ConnectorRecord } from "@/lib/types";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  useEffect(() => { apiGet<{ connectors: ConnectorRecord[] }>("/connectors").then((data) => setConnectors(data.connectors)).catch(() => setConnectors([])); }, []);

  return (
    <PageShell title="Connectors" description="External adapters configure via backend environment variables.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connectors.map((connector, index) => (
          <article key={connector.key} className={`panel p-5 flex flex-col justify-between min-h-[220px] ${["bg-[var(--yellow)]", "bg-[var(--cyan)]", "bg-[var(--lime)]", "bg-[var(--coral)]"][index % 4]}`}>
            <div>
              <div className="flex items-start justify-between">
                <Plug size={24} />
                {connector.ready ? (
                  <span className="badge badge-safe">Active</span>
                ) : (
                  <span className="badge">Soon</span>
                )}
              </div>
              <h2 className="mt-7 text-xl font-black">{connector.name}</h2>
              <p className="mt-2 text-sm leading-relaxed">{connector.description}</p>
            </div>
            <div className="mt-4 text-xs font-mono font-black uppercase tracking-wider opacity-70">
              {connector.todo}
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
