"use client";

import { useEffect, useState } from 'react';
import { Copy, Key, Plus, Trash2 } from 'lucide-react';

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
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage scoped MCP access for agents.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 mb-8">
        <div className="card p-6">
          <h2 className="text-lg font-medium mb-3">Create API Key</h2>
          <div className="space-y-4">
            <input value={purpose} onChange={(event) => setPurpose(event.target.value)} className="input-field w-full" placeholder="Purpose" />
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">Scopes</div>
              <div className="flex flex-wrap gap-2">
                {scopeOptions.map((scope) => (
                  <button
                    key={scope}
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      selectedScopes.includes(scope)
                        ? 'border-[var(--color-accent-brain)] text-[var(--color-accent-brain)]'
                        : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={createKey} className="btn-primary flex items-center">
              <Plus size={16} className="mr-2" /> Create Key
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-medium mb-2">MCP CLI</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Use `teamgraph-mcp login` to save your TeamGraph server URL and API key locally.
          </p>
          {latestRawKey && (
            <div className="bg-[var(--color-background-base)] border border-[var(--color-border-subtle)] p-4 rounded-lg">
              <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-2">New key</div>
              <div className="flex items-center justify-between gap-3">
                <code className="text-[var(--color-accent-mcp)] text-sm break-all">{latestRawKey}</code>
                <button onClick={() => navigator.clipboard.writeText(latestRawKey)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                  <Copy size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Active Keys</h2>
        <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-background-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="p-4 font-medium">Purpose</th>
                <th className="p-4 font-medium">Key Prefix</th>
                <th className="p-4 font-medium">Scopes</th>
                <th className="p-4 font-medium">Last Used</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-card-base)]">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-[var(--color-card-hover)]">
                  <td className="p-4 font-medium flex items-center">
                    <Key size={14} className="mr-2 text-[var(--color-text-muted)]" /> {key.purpose}
                  </td>
                  <td className="p-4 text-[var(--color-text-secondary)] font-mono">{key.key_prefix}••••••••</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{key.scopes.join(', ')}</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">
                    {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="text-[var(--color-accent-unsafe)] hover:bg-red-900/20 p-2 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
