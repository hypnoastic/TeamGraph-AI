"use client";

import { useEffect, useState } from 'react';
import { Copy, Key, Plus, Trash2 } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { ApiKeyRecord } from '@/lib/types';

const scopeOptions = ['context.read', 'context.write', 'graph.optimize'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [purpose, setPurpose] = useState('Local MCP');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['context.read', 'context.write']);
  const [latestRawKey, setLatestRawKey] = useState<string | null>(null);

  const fetchKeys = async () => {
    const data = await apiGet<ApiKeyRecord[]>('/api-keys');
    setKeys(data);
  };

  useEffect(() => {
    fetchKeys().catch(() => setKeys([]));
  }, []);

  const createKey = async () => {
    const response = await apiPost<ApiKeyRecord>('/api-keys', {
      purpose,
      scopes: selectedScopes,
      project_name: 'Core Platform',
    });
    setLatestRawKey(response.raw_key || null);
    await fetchKeys();
  };

  const revokeKey = async (id: string) => {
    await apiDelete(`/api-keys/${id}`);
    await fetchKeys();
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope) ? current.filter((value) => value !== scope) : [...current, scope]
    );
  };

  return (
    <PageShell>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 pb-8 border-b border-[var(--color-border-subtle)]/60">
        
        {/* Create API Key */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Create API Key</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider mb-2 text-[var(--color-text-muted)]">Purpose</label>
              <input
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                className="input-field w-full text-sm"
                placeholder="e.g. Local MCP Server"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Scopes</label>
              <div className="flex flex-wrap gap-2">
                {scopeOptions.map((scope) => (
                  <button
                    key={scope}
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1.5 rounded-lg text-xs border font-mono transition-colors ${
                      selectedScopes.includes(scope)
                        ? 'border-[var(--color-accent-brain)]/40 text-[var(--color-accent-brain)] bg-[var(--color-accent-brain)]/5'
                        : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-primary)]/30'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={createKey}
              className="px-4 py-2 rounded-lg bg-[var(--color-accent-brain)] text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center"
            >
              <Plus size={14} className="mr-1.5" /> Create Key
            </button>
          </div>
        </div>

        {/* MCP CLI */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">MCP Integration</h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Run <code className="font-mono text-[var(--color-text-primary)]">teamgraph-mcp login</code> in your terminal to save your TeamGraph server URL and generated API key locally.
          </p>
          {latestRawKey && (
            <div className="bg-[#0A0A0B] border border-[var(--color-border-subtle)] p-4 rounded-xl space-y-2">
              <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-mono">Newly generated raw key</div>
              <div className="flex items-center justify-between gap-3">
                <code className="text-[var(--color-accent-mcp)] text-xs break-all font-mono">{latestRawKey}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(latestRawKey)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Keys Table */}
      <div className="pt-8 space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Active Keys</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
                <th className="pb-3 font-mono uppercase tracking-wider font-medium">Purpose</th>
                <th className="pb-3 font-mono uppercase tracking-wider font-medium">Key Prefix</th>
                <th className="pb-3 font-mono uppercase tracking-wider font-medium">Scopes</th>
                <th className="pb-3 font-mono uppercase tracking-wider font-medium">Last Used</th>
                <th className="pb-3 font-mono uppercase tracking-wider font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]/40">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-[var(--color-text-muted)] text-center">
                    No active API keys found.
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-[var(--color-card-base)]/20 transition-colors">
                    <td className="py-3.5 font-medium text-[var(--color-text-primary)] flex items-center">
                      <Key size={12} className="mr-2 text-[var(--color-text-muted)]" /> {key.purpose}
                    </td>
                    <td className="py-3.5 text-[var(--color-text-secondary)] font-mono">{key.key_prefix}••••••••</td>
                    <td className="py-3.5 text-[var(--color-text-secondary)] font-mono">{key.scopes.join(', ')}</td>
                    <td className="py-3.5 text-[var(--color-text-secondary)]">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-[var(--color-accent-unsafe)] hover:text-red-400 p-1.5 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
