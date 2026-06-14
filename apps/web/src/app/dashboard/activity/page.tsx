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
    <PageShell>
      <div className="divide-y divide-[var(--color-border-subtle)]/40">
        {activities.length === 0 ? (
          <div className="text-[var(--color-text-muted)] text-sm py-12 text-center border border-dashed border-[var(--color-border-subtle)] rounded-xl">
            No system activity recorded yet.
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = iconForType(activity.type);
            return (
              <div
                key={activity.id}
                className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 transition-colors cursor-default"
              >
                <div className="mt-0.5 p-1.5 rounded bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] text-[var(--color-accent-brain)]">
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="font-semibold text-xs text-[var(--color-text-primary)]">{activity.title}</h3>
                    <span className="text-[10px] text-[var(--color-text-muted)] font-mono">
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{activity.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
