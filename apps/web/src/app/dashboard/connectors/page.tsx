"use client";

import { useEffect, useState } from 'react';
import { Plug, Search } from 'lucide-react';

import { apiGet } from '@/lib/api';
import type { ConnectorRecord } from '@/lib/types';

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);

  useEffect(() => {
    apiGet<{ connectors: ConnectorRecord[] }>('/connectors')
      .then((data) => setConnectors(data.connectors))
      .catch(() => setConnectors([]));
  }, []);

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">Connectors</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Future ingestion sources around the TeamGraph control layer.
          </p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Coming soon..." className="input-field pl-9 w-64" disabled />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((connector) => (
          <div key={connector.key} className="card p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-background-surface)] flex items-center justify-center border border-[var(--color-border-subtle)]">
                <Plug size={20} />
              </div>
              <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-[var(--color-background-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] rounded">
                {connector.state.replace('_', ' ')}
              </span>
            </div>
            <h3 className="font-medium text-lg mb-1">{connector.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">{connector.description}</p>
            <div className="mt-4 text-xs text-[var(--color-text-muted)]">{connector.todo}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
