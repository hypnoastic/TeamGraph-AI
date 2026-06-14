"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, Check, X, Edit3 } from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const token = localStorage.getItem('teamgraph_token');
      const res = await axios.get('http://localhost:8000/approvals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovals(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('teamgraph_token');
      await axios.post(`http://localhost:8000/approvals/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchApprovals();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">Approvals <span className="ml-3 bg-[var(--color-accent-review)]/20 text-[var(--color-accent-review)] text-sm px-2 py-0.5 rounded-full">{approvals.length}</span></h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Review risky or ambiguous context before it enters the brain.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {loading ? (
          <div className="text-[var(--color-text-muted)]">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="h-48 flex items-center justify-center border border-dashed border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-muted)]">
            No items pending review.
          </div>
        ) : (
          approvals.map((item, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="p-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-background-surface)]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{item.raw.title}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">Uploaded {new Date(item.raw.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    {item.review_item.riskTags?.map((tag: string, ti: number) => (
                      <span key={ti} className="px-2 py-1 bg-[var(--color-accent-review)]/10 text-[var(--color-accent-review)] border border-[var(--color-accent-review)]/20 rounded text-xs flex items-center">
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
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-2 text-[var(--color-text-muted)] uppercase tracking-wider">Curator Reason</h4>
                  <p className="text-sm">{item.review_item.reason}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button onClick={() => handleAction(item.review_item.id, 'reject')} className="btn-secondary flex items-center text-[var(--color-accent-unsafe)] hover:text-[var(--color-accent-unsafe)] hover:border-[var(--color-accent-unsafe)]">
                    <X size={16} className="mr-2" /> Reject
                  </button>
                  <button onClick={() => handleAction(item.review_item.id, 'approve')} className="btn-primary flex items-center bg-[var(--color-accent-safe)] text-[#07080A]">
                    <Check size={16} className="mr-2" /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
