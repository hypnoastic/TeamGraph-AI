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
    <PageShell
      eyebrow="Safety gate"
      title="Approvals"
      description="Review risky or ambiguous uploads before TeamGraph lets them through to Graphiti."
    >
      <div className="mb-2">
        <h2 className="text-xl font-bold flex items-center">
          Approvals{' '}
          <span className="ml-3 bg-[var(--color-accent-review)]/20 text-[var(--color-accent-review)] text-sm px-2 py-0.5 rounded-full">
            {approvals.length}
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {loading ? (
          <div className="text-[var(--color-text-muted)]">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-muted)]">
            No items pending review.
          </div>
        ) : (
          approvals.map((item, index) => {
            if (!item.review_item) return null;
            return (
            <div key={index} className="card overflow-hidden">
              <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-background-surface)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{item.raw.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Uploaded {new Date(item.raw.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.review_item?.riskTags?.map((tag: string, tagIndex: number) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-[var(--color-accent-review)]/10 text-[var(--color-accent-review)] border border-[var(--color-accent-review)]/20 rounded text-xs flex items-center"
                      >
                        <AlertTriangle size={12} className="mr-1" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[var(--color-background-base)] p-4 rounded border border-[var(--color-border-subtle)]">
                  <p className="text-sm font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap">{item.raw.content}</p>
                </div>
              </div>

              <div className="p-6 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Curator Reason</div>
                    <p className="text-sm mt-2">{item.review_item?.reason}</p>
                  </div>
                  {item.review_item?.proposedSummary && (
                    <div>
                      <div className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Proposed Summary</div>
                      <p className="text-sm mt-2 text-[var(--color-text-secondary)]">{item.review_item.proposedSummary}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAction(item.review_item!.id, 'reject')}
                    className="btn-secondary flex items-center text-[var(--color-accent-unsafe)] hover:text-[var(--color-accent-unsafe)] hover:border-[var(--color-accent-unsafe)]"
                  >
                    <X size={16} className="mr-2" /> Reject
                  </button>
                  <button
                    onClick={() => handleAction(item.review_item!.id, 'approve')}
                    className="btn-primary flex items-center bg-[var(--color-accent-safe)] text-[#07080A]"
                  >
                    <Check size={16} className="mr-2" /> Approve
                  </button>
                </div>
              </div>
            </div>
          )})
        )}
      </div>
    </PageShell>
  );
}
