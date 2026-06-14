"use client";

import { useState } from 'react';
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

export default function ApiKeysPage() {
  const [keys] = useState([
    { id: '1', name: 'Macbook Local MCP', prefix: 'tg_', createdAt: new Date().toISOString(), lastUsed: new Date().toISOString() },
    { id: '2', name: 'CI/CD Pipeline', prefix: 'tg_', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), lastUsed: null }
  ]);

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage MCP access tokens for AI agents.</p>
        </div>
        <button className="btn-primary flex items-center"><Plus size={16} className="mr-2"/> Create Key</button>
      </div>

      <div className="card p-8 mb-8 bg-gradient-to-br from-[var(--color-card-base)] to-[var(--color-background-surface)]">
        <h2 className="text-lg font-medium mb-2">MCP CLI Configuration</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">Run this in your terminal to authenticate your local MCP server:</p>
        <div className="bg-[var(--color-background-base)] border border-[var(--color-border-subtle)] p-4 rounded-lg flex items-center justify-between">
          <code className="text-[var(--color-accent-mcp)] text-sm">npx @teamgraph/mcp login</code>
          <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"><Copy size={16}/></button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Active Keys</h2>
        <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--color-background-surface)] text-[var(--color-text-muted)]">
              <tr>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Key Prefix</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Last Used</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] bg-[var(--color-card-base)]">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-[var(--color-card-hover)]">
                  <td className="p-4 font-medium flex items-center"><Key size={14} className="mr-2 text-[var(--color-text-muted)]"/> {k.name}</td>
                  <td className="p-4 text-[var(--color-text-secondary)] font-mono">{k.prefix}••••••••</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{new Date(k.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-[var(--color-text-secondary)]">{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString() : 'Never'}</td>
                  <td className="p-4 text-right">
                    <button className="text-[var(--color-accent-unsafe)] hover:bg-red-900/20 p-2 rounded transition-colors"><Trash2 size={16}/></button>
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
