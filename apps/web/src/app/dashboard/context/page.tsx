"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Clock, Search, Filter } from 'lucide-react';

export default function ContextInboxPage() {
  const [inbox, setInbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const token = localStorage.getItem('teamgraph_token');
      const res = await axios.get('http://localhost:8000/context/inbox', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInbox(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getLaneIcon = (lane: string) => {
    switch(lane) {
      case 'auto_curated': return <CheckCircle className="text-[var(--color-accent-safe)]" size={16} />;
      case 'pending_review': return <Clock className="text-[var(--color-accent-review)]" size={16} />;
      case 'quarantined': return <AlertTriangle className="text-[var(--color-accent-unsafe)]" size={16} />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Context Inbox</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">View the ingestion stream of raw context.</p>
        </div>
        <div className="flex space-x-4">
          <button className="btn-secondary flex items-center"><Filter size={16} className="mr-2"/> Filter</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          inbox.map((item, i) => (
            <div key={i} className="card p-6 flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg font-medium">{item.raw.title}</span>
                  <span className="px-2 py-1 bg-[var(--color-background-surface)] rounded text-xs text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                    {item.raw.sourceType}
                  </span>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm line-clamp-2 mb-4">{item.raw.content}</p>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Uploaded {new Date(item.raw.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="md:w-48 bg-[var(--color-background-surface)] rounded-lg border border-[var(--color-border-subtle)] p-4 flex flex-col justify-center">
                <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Lane Decision</span>
                <div className="flex items-center space-x-2">
                  {getLaneIcon(item.lane)}
                  <span className="text-sm font-medium capitalize">{item.lane.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
