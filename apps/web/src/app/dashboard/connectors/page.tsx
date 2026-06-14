"use client";

import { useEffect, useState } from 'react';
import { Plug, RefreshCcw, Search, ShieldCheck, Unplug } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet, apiPost } from '@/lib/api';
import type { ConnectorRecord } from '@/lib/types';

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const refreshConnectors = () => {
    apiGet<{ connectors: ConnectorRecord[] }>('/connectors')
      .then((data) => setConnectors(data.connectors))
      .catch(() => setConnectors([]));
  };

  useEffect(() => {
    refreshConnectors();
  }, []);

  const handleConnect = async (connector: ConnectorRecord) => {
    if (!connector.ready) return;
    setBusyKey(`${connector.key}-connect`);
    try {
      const response = await apiGet<{ auth_url: string }>(`/connectors/${connector.key}/start`);
      window.open(response.auth_url, '_blank', 'noopener,noreferrer');
    } finally {
      setBusyKey(null);
    }
  };

  const handleSync = async (connector: ConnectorRecord) => {
    setBusyKey(`${connector.key}-sync`);
    try {
      await apiPost(`/connectors/${connector.key}/sync`, {});
      refreshConnectors();
    } finally {
      setBusyKey(null);
    }
  };

  const handleDisconnect = async (connector: ConnectorRecord) => {
    setBusyKey(`${connector.key}-disconnect`);
    try {
      await apiPost(`/connectors/${connector.key}/disconnect`, {});
      refreshConnectors();
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <PageShell
      eyebrow="Connectors"
      title="Launch integrations"
      description="GitHub, Slack, and Google Drive are now wired as real installable integrations in the TeamGraph control plane. The remaining sources stay clearly marked as follow-on work."
      actions={
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Status only" className="input-field pl-9 w-56" disabled />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {connectors.map((connector) => {
          const isLive = ['github', 'slack', 'google-drive'].includes(connector.key);
          return (
            <div key={connector.key} className="card p-6 flex flex-col gap-5 rounded-[28px]">
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-background-surface)] flex items-center justify-center border border-[var(--color-border-subtle)]">
                  <Plug size={20} className="text-[var(--color-accent-brain)]" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-[0.2em] bg-[var(--color-background-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                  {connector.state.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="font-medium text-xl">{connector.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{connector.description}</p>
              </div>

              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)]/70 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Mode</span>
                  <span className="text-[var(--color-text-primary)]">{connector.mode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Account</span>
                  <span className="text-[var(--color-text-primary)]">{connector.connected_account || 'Not connected'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Last sync</span>
                  <span className="text-[var(--color-text-primary)]">
                    {connector.last_synced_at ? new Date(connector.last_synced_at).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-text-muted)] leading-5">{connector.todo}</div>

              {isLive ? (
                <div className="flex flex-wrap gap-3 mt-auto">
                  <button
                    type="button"
                    disabled={!connector.ready || busyKey === `${connector.key}-connect`}
                    onClick={() => handleConnect(connector)}
                    className="btn-primary !rounded-2xl bg-[var(--color-accent-brain)] text-[#071012] disabled:opacity-50"
                  >
                    <ShieldCheck size={14} className="inline mr-2" />
                    Connect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSync(connector)}
                    disabled={busyKey === `${connector.key}-sync`}
                    className="btn-secondary !rounded-2xl"
                  >
                    <RefreshCcw size={14} className="inline mr-2" />
                    Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDisconnect(connector)}
                    disabled={busyKey === `${connector.key}-disconnect`}
                    className="btn-secondary !rounded-2xl"
                  >
                    <Unplug size={14} className="inline mr-2" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="mt-auto text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                  Coming after launch
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
