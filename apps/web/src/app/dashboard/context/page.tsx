"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Filter } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet } from '@/lib/api';
import type { InboxItem } from '@/lib/types';

export default function ContextInboxPage() {
  const [inbox, setInbox] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<InboxItem[]>('/context/inbox')
      .then(setInbox)
      .catch(() => setInbox([]))
      .finally(() => setLoading(false));
  }, []);

  const getLaneBadge = (lane: string) => {
    switch (lane) {
      case 'auto_curated':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent-safe)] bg-[var(--color-accent-safe)]/10 px-2.5 py-1 rounded-full border border-[var(--color-accent-safe)]/20">
            <CheckCircle size={10} /> Auto Curated
          </span>
        );
      case 'pending_review':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent-review)] bg-[var(--color-accent-review)]/10 px-2.5 py-1 rounded-full border border-[var(--color-accent-review)]/20">
            <Clock size={10} /> Pending Review
          </span>
        );
      case 'quarantined':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--color-accent-unsafe)] bg-[var(--color-accent-unsafe)]/10 px-2.5 py-1 rounded-full border border-[var(--color-accent-unsafe)]/20">
            <AlertTriangle size={10} /> Quarantined
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-card-base)] px-2.5 py-1 rounded-full border border-[var(--color-border-subtle)]">
            {lane}
          </span>
        );
    }
  };

  return (
    <PageShell
      actions={
        <button className="px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/50 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] flex items-center transition-colors">
          <Filter size={14} className="mr-1.5" /> Filter
        </button>
      }
    >
      <div className="divide-y divide-[var(--color-border-subtle)]/60">
        {loading ? (
          <div className="text-[var(--color-text-muted)] text-sm py-4">Loading inbox items...</div>
        ) : inbox.length === 0 ? (
          <div className="text-[var(--color-text-muted)] text-sm py-12 text-center border border-dashed border-[var(--color-border-subtle)] rounded-xl">
            No ingestion events recorded yet.
          </div>
        ) : (
          inbox.map((item, index) => (
            <div key={index} className="py-6 first:pt-0 last:pb-0 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-[var(--color-text-primary)]">
                    {item.raw.title}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] rounded text-[var(--color-text-secondary)]">
                    {item.raw.sourceType}
                  </span>
                  {item.context?.brainMode && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border border-[var(--color-accent-brain)]/20 text-[var(--color-accent-brain)] bg-[var(--color-accent-brain)]/5 rounded">
                      {item.context.brainMode}
                    </span>
                  )}
                </div>
                <div>{getLaneBadge(item.lane)}</div>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-4xl">
                {item.raw.content}
              </p>

              {item.review_item?.reason && (
                <div className="text-xs text-[var(--color-text-muted)] pl-3 border-l-2 border-[var(--color-border-subtle)]">
                  Curation notes: {item.review_item.reason}
                </div>
              )}

              <div className="flex gap-4 text-[10px] text-[var(--color-text-muted)] font-mono pt-1">
                <span>Uploaded: {new Date(item.raw.createdAt).toLocaleString()}</span>
                {item.context?.graphitiEpisodeUuid && (
                  <span>Episode: {item.context.graphitiEpisodeUuid.slice(0, 8)}...</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
