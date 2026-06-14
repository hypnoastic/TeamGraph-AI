"use client";

import { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive, ShieldAlert } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet } from '@/lib/api';
import type { ActivityRecord } from '@/lib/types';

function iconForType(type: string) {
  if (type.includes('approved') || type.includes('ingested')) return Cpu;
  if (type.includes('quarantine') || type.includes('rejected')) return ShieldAlert;
  if (type.includes('optimize')) return HardDrive;
  return Activity;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    apiGet<ActivityRecord[]>('/activity')
      .then(setActivities)
      .catch(() => setActivities([]));
  }, []);

  return (
    <PageShell
      eyebrow="Audit trail"
      title="System Activity"
      description="Review authentication events, connector actions, curation changes, and operational activity across the TeamGraph control plane."
    >
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = iconForType(activity.type);
          return (
            <div
              key={activity.id}
              className="card p-4 flex items-start space-x-4 hover:bg-[var(--color-background-surface)] transition-colors cursor-default"
            >
              <div className="mt-1 p-2 rounded-lg bg-[var(--color-background-surface)] text-[var(--color-accent-brain)]">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-[var(--color-text-primary)]">{activity.title}</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{activity.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
