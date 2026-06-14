"use client";

import { Activity, ShieldAlert, Cpu, HardDrive } from 'lucide-react';

const activities = [
  { id: 1, type: 'curator', title: 'Gemini Curator Run', desc: 'Processed 14 items. 12 auto-curated, 2 pending review.', time: '10 minutes ago', icon: Cpu, color: 'text-[var(--color-accent-mcp)]', bg: 'bg-[var(--color-accent-mcp)]/10' },
  { id: 2, type: 'security', title: 'Suspicious MCP Activity', desc: 'API key "CI/CD Pipeline" was used from an unknown IP address.', time: '2 hours ago', icon: ShieldAlert, color: 'text-[var(--color-accent-unsafe)]', bg: 'bg-[var(--color-accent-unsafe)]/10' },
  { id: 3, type: 'system', title: 'Graph Optimizer Completed', desc: 'Optimized retrieval priority for 1,245 nodes.', time: '5 hours ago', icon: HardDrive, color: 'text-[var(--color-accent-brain)]', bg: 'bg-[var(--color-accent-brain)]/10' },
  { id: 4, type: 'system', title: 'Neo4j Backup', desc: 'Automated snapshot created successfully.', time: '1 day ago', icon: Database, color: 'text-[var(--color-text-secondary)]', bg: 'bg-[var(--color-background-surface)]' },
];

function Database(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
}

export default function ActivityPage() {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center">System Activity</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Audit logs for the brain infrastructure.</p>
      </div>

      <div className="space-y-4">
        {activities.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.id} className="card p-4 flex items-start space-x-4 hover:bg-[var(--color-background-surface)] transition-colors cursor-default">
              <div className={`mt-1 p-2 rounded-lg ${a.bg} ${a.color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-[var(--color-text-primary)]">{a.title}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">{a.time}</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{a.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
