"use client";

import { Plug, Plus, Search } from 'lucide-react';

const connectors = [
  { name: 'Slack', desc: 'Ingest channel history and threads.', status: 'connected', color: '#E5A00D' },
  { name: 'GitHub', desc: 'Ingest PRs, issues, and READMEs.', status: 'connected', color: '#F5F7FA' },
  { name: 'Google Drive', desc: 'Ingest Docs, Sheets, and Slides.', status: 'available', color: '#34A853' },
  { name: 'Notion', desc: 'Ingest workspaces and databases.', status: 'available', color: '#F5F7FA' },
  { name: 'Jira', desc: 'Ingest tickets and epics.', status: 'available', color: '#0052CC' },
  { name: 'Teams', desc: 'Ingest chats and meeting notes.', status: 'available', color: '#6264A7' }
];

export default function ConnectorsPage() {
  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">Connectors</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Connect workplace tools to the ingestion stream.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" placeholder="Search connectors..." className="input-field pl-9 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 border-dashed border-2 flex flex-col items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] cursor-pointer group transition-all">
          <div className="w-12 h-12 rounded-full bg-[var(--color-background-surface)] group-hover:bg-[var(--color-card-base)] flex items-center justify-center mb-4">
            <Plus size={24} />
          </div>
          <p className="font-medium">Custom Webhook</p>
          <p className="text-xs mt-1 text-center px-4">Stream JSON to the TeamGraph API</p>
        </div>

        {connectors.map((c, i) => (
          <div key={i} className="card p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-background-surface)] flex items-center justify-center border border-[var(--color-border-subtle)]" style={{color: c.color}}>
                <Plug size={20} />
              </div>
              {c.status === 'connected' ? (
                <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-[var(--color-accent-safe)]/10 text-[var(--color-accent-safe)] border border-[var(--color-accent-safe)]/20 rounded">Active</span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-[var(--color-background-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] rounded">Available</span>
              )}
            </div>
            <h3 className="font-medium text-lg mb-1">{c.name}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] flex-1">{c.desc}</p>
            <div className="mt-6 pt-4 border-t border-[var(--color-border-subtle)] flex justify-end">
              {c.status === 'connected' ? (
                <button className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-medium">Configure</button>
              ) : (
                <button className="text-sm text-[var(--color-text-primary)] hover:underline font-medium">Connect</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
