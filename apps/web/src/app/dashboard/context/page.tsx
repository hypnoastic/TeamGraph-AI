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

  const getLaneIcon = (lane: string) => {
    switch (lane) {
      case 'auto_curated':
        return <CheckCircle className="text-[var(--color-accent-safe)]" size={16} />;
      case 'pending_review':
        return <Clock className="text-[var(--color-accent-review)]" size={16} />;
      case 'quarantined':
        return <AlertTriangle className="text-[var(--color-accent-unsafe)]" size={16} />;
      default:
        return null;
    }
  };

  return (
    <PageShell
      eyebrow="Ingestion pipeline"
      title="Context Inbox"
      description="Review raw uploads, lane decisions, and Graphiti episode linkage before or after they enter the live brain."
      actions={
        <button className="btn-secondary flex items-center !rounded-2xl">
          <Filter size={16} className="mr-2" /> Flow
        </button>
      }
    >

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          inbox.map((item, index) => (
            <div key={index} className="card p-6 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-lg font-medium">{item.raw.title}</span>
                    <span className="px-2 py-1 bg-[var(--color-background-surface)] rounded text-xs text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                      {item.raw.sourceType}
                    </span>
                    {item.context?.brainMode && (
                      <span className="px-2 py-1 bg-[var(--color-card-base)] rounded text-xs text-[var(--color-accent-brain)] border border-[var(--color-accent-brain)]/20">
                        {item.context.brainMode}
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-sm line-clamp-3 mb-4">{item.raw.content}</p>
                  <div className="text-xs text-[var(--color-text-muted)] space-y-1">
                    <div>Uploaded {new Date(item.raw.createdAt).toLocaleString()}</div>
                    {item.context?.graphitiEpisodeUuid && <div>Episode {item.context.graphitiEpisodeUuid}</div>}
                  </div>
                </div>

                <div className="md:w-56 bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-border-subtle)] p-4">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">Lane Decision</span>
                  <div className="flex items-center space-x-2 mb-3">
                    {getLaneIcon(item.lane)}
                    <span className="text-sm font-medium capitalize">{item.lane.replace('_', ' ')}</span>
                  </div>
                  {item.review_item?.reason && (
                    <div className="text-xs text-[var(--color-text-secondary)]">{item.review_item.reason}</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageShell>
  );
}
