"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, Zap } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('teamgraph_token');
      const res = await axios.get('http://localhost:8000/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    try {
      const token = localStorage.getItem('teamgraph_token');
      await axios.post('http://localhost:8000/settings/optimize', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Graph optimization triggered successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to trigger optimization.');
    }
  };

  if (loading) return <div className="text-[var(--color-text-muted)] p-8">Loading settings...</div>;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">Settings</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Configure your organization's brain.</p>
      </div>

      <div className="space-y-8">
        <section className="card p-6">
          <h2 className="text-lg font-medium border-b border-[var(--color-border-subtle)] pb-2 mb-4">General</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Organization Name</label>
              <input type="text" defaultValue={settings.organization} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Workspace Domain</label>
              <input type="text" defaultValue="acme.local" className="input-field w-full" disabled />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-medium border-b border-[var(--color-border-subtle)] pb-2 mb-4">AI Curator Configuration</h2>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Model</label>
              <select className="input-field w-full bg-[var(--color-background-surface)]">
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Recommended)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro</option>
              </select>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">Using flash-lite keeps the live brain cost-efficient while running continuous curation loops.</p>
            </div>
            <div className="pt-2">
              <span className="text-sm text-[var(--color-text-secondary)] mr-4">Current Mode:</span>
              <span className={`px-2 py-1 rounded text-xs font-mono border ${settings.gemini_mode === 'live' ? 'bg-[var(--color-accent-safe)]/10 text-[var(--color-accent-safe)] border-[var(--color-accent-safe)]/20' : 'bg-[var(--color-accent-review)]/10 text-[var(--color-accent-review)] border-[var(--color-accent-review)]/20'}`}>
                {settings.gemini_mode.toUpperCase()}
              </span>
            </div>
          </div>
        </section>

        <section className="card p-6 border-[var(--color-accent-brain)]/30">
          <h2 className="text-lg font-medium border-b border-[var(--color-border-subtle)] pb-2 mb-4">Graph Optimizer</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            The Graph Optimizer runs heuristics on the Neo4j graph to re-weight edges, update retrieval priorities for recent context, and prune redundant nodes.
          </p>
          <button onClick={handleOptimize} className="btn-primary flex items-center bg-[var(--color-accent-brain)] text-[#07080A]">
            <Zap size={16} className="mr-2" /> Run Optimizer Now
          </button>
        </section>
        
        <div className="flex justify-end">
          <button className="btn-primary flex items-center">
            <Save size={16} className="mr-2" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
