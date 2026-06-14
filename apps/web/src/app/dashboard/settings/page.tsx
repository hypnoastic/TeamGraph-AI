"use client";

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet, apiPost } from '@/lib/api';
import type { SettingsResponse } from '@/lib/types';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<SettingsResponse>('/settings')
      .then(setSettings)
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  const handleOptimize = async () => {
    await apiPost('/settings/optimize', {});
    const refreshed = await apiGet<SettingsResponse>('/settings');
    setSettings(refreshed);
    alert('Graph optimization triggered successfully.');
  };

  if (loading) return <div className="text-[var(--color-text-muted)] text-xs py-4">Loading settings...</div>;
  if (!settings) return <div className="text-[var(--color-accent-unsafe)] text-xs py-4">Failed to load settings.</div>;

  return (
    <PageShell>
      <div className="space-y-10">
        
        {/* System Status Table */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">System Integration</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="py-3.5 border-b border-[var(--color-border-subtle)]/60 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Graphiti Runtime</span>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{settings.graphiti_mode}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">{settings.graphiti_provider}</div>
            </div>
            <div className="py-3.5 border-b border-[var(--color-border-subtle)]/60 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Postgres Identity Database</span>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{settings.postgres_status}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">Org: {settings.organization}</div>
            </div>
            <div className="py-3.5 border-b border-[var(--color-border-subtle)]/60 space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Neo4j Graph Database</span>
              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{settings.neo4j_status}</div>
              <div className="text-xs text-[var(--color-text-secondary)]">LLM Caching: {settings.gemini_mode}</div>
            </div>
          </div>
        </div>

        {/* Curation Analytics */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Curation Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="py-3 space-y-1 border-l-2 border-[var(--color-border-subtle)] pl-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Pending Review</span>
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{settings.pending_approvals}</div>
            </div>
            <div className="py-3 space-y-1 border-l-2 border-[var(--color-border-subtle)] pl-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Auto Ingested</span>
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{settings.auto_curated_count}</div>
            </div>
            <div className="py-3 space-y-1 border-l-2 border-[var(--color-border-subtle)] pl-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Quarantined</span>
              <div className="text-xl font-bold text-[var(--color-text-primary)]">{settings.quarantined_count}</div>
            </div>
            <div className="py-3 space-y-1 border-l-2 border-[var(--color-border-subtle)] pl-4">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Latest Ingestion</span>
              <div className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                {settings.latest_episode_ingested
                  ? new Date(settings.latest_episode_ingested).toLocaleDateString()
                  : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Optimizer Control */}
        <div className="pt-6 border-t border-[var(--color-border-subtle)]/60 space-y-4">
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Graph Optimization</h2>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
            Recompute graph search indexes, optimize entity clusters, and refresh prompt priorities in Neo4j. This runs a background process and adds an entry to the system activity log.
          </p>
          <button
            onClick={handleOptimize}
            className="px-4 py-2 rounded-lg bg-[var(--color-accent-brain)] text-black text-xs font-semibold hover:opacity-90 transition-opacity flex items-center"
          >
            <Zap size={12} className="mr-1.5" /> Optimize Graph
          </button>
        </div>

      </div>
    </PageShell>
  );
}
