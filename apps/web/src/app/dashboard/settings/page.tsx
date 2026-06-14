"use client";

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

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

  if (loading) return <div className="text-[var(--color-text-muted)] p-8">Loading settings...</div>;
  if (!settings) return <div className="text-[var(--color-accent-unsafe)] p-8">Failed to load settings.</div>;

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Monitor the TeamGraph live brain runtime.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Graphiti mode</div>
          <div className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
            {settings.graphiti_mode}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] mt-2">
            Provider: {settings.graphiti_provider}
          </div>
          {settings.graphiti_reason && (
            <div className="mt-3 text-xs text-[var(--color-text-muted)]">{settings.graphiti_reason}</div>
          )}
        </div>

        <div className="card p-6">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Neo4j status</div>
          <div className="mt-2 text-xl font-semibold text-[var(--color-text-primary)]">
            {settings.neo4j_status}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] mt-2">
            Gemini mode: {settings.gemini_mode}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Pending approvals</div>
          <div className="mt-2 text-2xl font-semibold">{settings.pending_approvals}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Auto-curated</div>
          <div className="mt-2 text-2xl font-semibold">{settings.auto_curated_count}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Quarantined</div>
          <div className="mt-2 text-2xl font-semibold">{settings.quarantined_count}</div>
        </div>
        <div className="card p-4">
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Latest ingest</div>
          <div className="mt-2 text-sm font-semibold">
            {settings.latest_episode_ingested
              ? new Date(settings.latest_episode_ingested).toLocaleString()
              : 'No ingest yet'}
          </div>
        </div>
      </div>

      <section className="card p-6 border-[var(--color-accent-brain)]/30">
        <h2 className="text-lg font-medium border-b border-[var(--color-border-subtle)] pb-2 mb-4">
          Graph Optimizer
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Recomputes retrieval priority across trusted context and records a system activity event.
        </p>
        <button onClick={handleOptimize} className="btn-primary flex items-center bg-[var(--color-accent-brain)] text-[#07080A]">
          <Zap size={16} className="mr-2" /> Run Optimizer Now
        </button>
      </section>
    </div>
  );
}
