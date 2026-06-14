"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet, apiPost } from '@/lib/api';
import type { InboxItem } from '@/lib/types';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const data = await apiGet<Array<{ raw: Record<string, any>; review_item: Record<string, any> }>>('/approvals');
      setApprovals(
        data.map((item) => ({
          raw: item.raw,
          review_item: item.review_item,
          lane: 'pending_review',
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await apiPost(`/approvals/${id}/${action}`, {});
    await fetchApprovals();
  };

  return (
    <PageShell>
      <div className="divide-y divide-[var(--color-border-subtle)]/60">
        {loading ? (
          <div className="text-[var(--color-text-muted)] text-sm py-4">Loading approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="text-[var(--color-text-muted)] text-sm py-12 text-center border border-dashed border-[var(--color-border-subtle)] rounded-xl">
            No items pending approval.
          </div>
        ) : (
          approvals.map((item, index) => {
            if (!item.review_item) return null;
            return (
              <div key={index} className="py-6 first:pt-0 last:pb-0 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{item.raw.title}</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Uploaded {new Date(item.raw.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {item.review_item?.riskTags?.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-2.5 py-0.5 bg-[var(--color-accent-review)]/10 text-[var(--color-accent-review)] border border-[var(--color-accent-review)]/20 rounded-full text-[10px] flex items-center font-mono uppercase tracking-wider"
                      >
                        <AlertTriangle size={10} className="mr-1" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pl-4 border-l-2 border-[var(--color-border-subtle)] py-1 text-sm font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                  {item.raw.content}
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Curation Reason</div>
                    <p className="text-xs text-[var(--color-text-secondary)]">{item.review_item?.reason}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(item.review_item!.id, 'reject')}
                      className="px-3 py-1.5 rounded-lg border border-red-500/20 text-[var(--color-accent-unsafe)] bg-red-500/5 hover:bg-red-500/10 transition-colors text-xs font-medium flex items-center"
                    >
                      <X size={12} className="mr-1" /> Reject
                    </button>
                    <button
                      onClick={() => handleAction(item.review_item!.id, 'approve')}
                      className="px-3 py-1.5 rounded-lg border border-[var(--color-accent-safe)]/20 text-[var(--color-accent-safe)] bg-[var(--color-accent-safe)]/5 hover:bg-[var(--color-accent-safe)]/10 transition-colors text-xs font-medium flex items-center"
                    >
                      <Check size={12} className="mr-1" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
