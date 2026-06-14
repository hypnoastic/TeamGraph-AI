"use client";

import { useEffect, useState } from 'react';
import { Plug, RefreshCcw, ShieldCheck, Unplug } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet, apiPost } from '@/lib/api';
import type { ConnectorRecord } from '@/lib/types';

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('teamgraph_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const refreshConnectors = () => {
    apiGet<{ connectors: ConnectorRecord[] }>('/connectors')
      .then((data) => {
        const isDemoUser = user?.is_demo || user?.email === 'demo@teamgraph.local';
        if (isDemoUser) {
          const saved = localStorage.getItem('teamgraph_demo_connectors');
          if (saved) {
            const savedMap = JSON.parse(saved);
            const merged = data.connectors.map(c => savedMap[c.key] ? { ...c, ...savedMap[c.key] } : c);
            setConnectors(merged);
          } else {
            setConnectors(data.connectors);
          }
        } else {
          setConnectors(data.connectors);
        }
      })
      .catch(() => setConnectors([]));
  };

  useEffect(() => {
    if (user !== null) {
      refreshConnectors();
    }
  }, [user]);

  const updateDemoConnector = (key: string, updated: any) => {
    const saved = localStorage.getItem('teamgraph_demo_connectors');
    const savedMap = saved ? JSON.parse(saved) : {};
    savedMap[key] = updated;
    localStorage.setItem('teamgraph_demo_connectors', JSON.stringify(savedMap));
    setConnectors(prev => prev.map(c => c.key === key ? updated : c));
  };

  const handleConnect = async (connector: ConnectorRecord) => {
    if (!connector.ready) return;
    const isDemoUser = user?.is_demo || user?.email === 'demo@teamgraph.local';

    if (isDemoUser) {
      setBusyKey(`${connector.key}-connect`);
      await new Promise(r => setTimeout(r, 600));
      const updated = {
        ...connector,
        state: 'connected' as const,
        connected_account: `${connector.key}-demo@teamgraph.ai`,
        last_synced_at: new Date().toISOString()
      };
      updateDemoConnector(connector.key, updated);
      setBusyKey(null);
      return;
    }

    setBusyKey(`${connector.key}-connect`);
    try {
      const response = await apiGet<{ auth_url: string }>(`/connectors/${connector.key}/start`);
      window.open(response.auth_url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSync = async (connector: ConnectorRecord) => {
    const isDemoUser = user?.is_demo || user?.email === 'demo@teamgraph.local';

    if (isDemoUser) {
      setBusyKey(`${connector.key}-sync`);
      setConnectors(prev => prev.map(c => c.key === connector.key ? { ...c, state: 'syncing' as const } : c));
      await new Promise(r => setTimeout(r, 1500));
      const updated = {
        ...connector,
        state: 'connected' as const,
        last_synced_at: new Date().toISOString()
      };
      updateDemoConnector(connector.key, updated);
      setBusyKey(null);
      return;
    }

    setBusyKey(`${connector.key}-sync`);
    try {
      await apiPost(`/connectors/${connector.key}/sync`, {});
      refreshConnectors();
    } finally {
      setBusyKey(null);
    }
  };

  const handleDisconnect = async (connector: ConnectorRecord) => {
    const isDemoUser = user?.is_demo || user?.email === 'demo@teamgraph.local';

    if (isDemoUser) {
      setBusyKey(`${connector.key}-disconnect`);
      await new Promise(r => setTimeout(r, 400));
      const updated = {
        ...connector,
        state: 'disconnected' as const,
        connected_account: undefined
      };
      updateDemoConnector(connector.key, updated);
      setBusyKey(null);
      return;
    }

    setBusyKey(`${connector.key}-disconnect`);
    try {
      await apiPost(`/connectors/${connector.key}/disconnect`, {});
      refreshConnectors();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <PageShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connectors.map((connector) => {
          const isLive = ['github', 'slack', 'google-drive'].includes(connector.key);
          const isConnected = connector.state === 'connected';
          const isSyncing = connector.state === 'syncing';

          return (
            <div key={connector.key} className="border border-[var(--color-border-subtle)] bg-[#0A0A0B] rounded-2xl p-6 flex flex-col justify-between min-h-[340px] transition-colors hover:border-[var(--color-border-subtle)]/80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-brain)]/10 border border-[var(--color-accent-brain)]/20 flex items-center justify-center text-[var(--color-accent-brain)]">
                    <Plug size={16} />
                  </div>
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isConnected
                      ? 'text-[var(--color-accent-safe)] bg-[var(--color-accent-safe)]/10 border-[var(--color-accent-safe)]/20'
                      : isSyncing
                      ? 'text-[var(--color-accent-brain)] bg-[var(--color-accent-brain)]/10 border-[var(--color-accent-brain)]/20'
                      : 'text-[var(--color-text-muted)] bg-[var(--color-card-base)] border-[var(--color-border-subtle)]'
                  }`}>
                    {connector.state.replace('_', ' ')}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-base text-[var(--color-text-primary)]">{connector.name}</h3>
                  <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{connector.description}</p>
                </div>

                {/* Metadata List */}
                <div className="space-y-1.5 text-xs border-t border-[var(--color-border-subtle)]/40 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Mode</span>
                    <span className="text-[var(--color-text-secondary)] font-mono">{connector.mode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Account</span>
                    <span className="text-[var(--color-text-secondary)] truncate max-w-[150px]">{connector.connected_account || '—'}</span>
                  </div>
                  {connector.last_synced_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Synced</span>
                      <span className="text-[var(--color-text-secondary)]">{new Date(connector.last_synced_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--color-border-subtle)]/40 mt-6 flex flex-col gap-2">
                {isLive ? (
                  <div className="flex flex-wrap gap-2">
                    {!isConnected && !isSyncing && (
                      <button
                        type="button"
                        disabled={!connector.ready || busyKey === `${connector.key}-connect`}
                        onClick={() => handleConnect(connector)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-accent-brain)] text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center"
                      >
                        <ShieldCheck size={12} className="mr-1" />
                        Connect
                      </button>
                    )}
                    {(isConnected || isSyncing) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSync(connector)}
                          disabled={busyKey === `${connector.key}-sync` || isSyncing}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center"
                        >
                          <RefreshCcw size={12} className={isSyncing ? 'animate-spin text-[var(--color-accent-brain)]' : ''} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(connector)}
                          disabled={busyKey === `${connector.key}-disconnect` || isSyncing}
                          className="px-2.5 py-1.5 rounded-lg border border-[var(--color-border-subtle)] text-xs text-[var(--color-accent-unsafe)] hover:bg-red-500/5 transition-colors flex items-center justify-center"
                        >
                          <Unplug size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-mono">
                    Feature Coming Soon
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
