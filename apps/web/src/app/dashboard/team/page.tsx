"use client";

import { useEffect, useState } from 'react';
import { Mail, MoreHorizontal } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiGet } from '@/lib/api';
import type { TeamMember } from '@/lib/types';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    apiGet<TeamMember[]>('/team')
      .then(setTeam)
      .catch(() => setTeam([]));
  }, []);

  return (
    <PageShell>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
              <th className="pb-3 font-mono uppercase tracking-wider font-medium">User</th>
              <th className="pb-3 font-mono uppercase tracking-wider font-medium">Role</th>
              <th className="pb-3 font-mono uppercase tracking-wider font-medium">Project Access</th>
              <th className="pb-3 font-mono uppercase tracking-wider font-medium text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]/40">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-[var(--color-card-base)]/20 transition-colors">
                <td className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[var(--color-border-subtle)] flex items-center justify-center font-semibold text-[10px] text-[var(--color-text-secondary)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">{member.name}</div>
                      <div className="text-[var(--color-text-muted)] text-[10px] flex items-center mt-0.5 font-mono">
                        <Mail size={10} className="mr-1" /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider font-medium border ${
                      member.role === 'admin'
                        ? 'bg-[var(--color-accent-brain)]/10 text-[var(--color-accent-brain)] border-[var(--color-accent-brain)]/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="py-3.5 text-[var(--color-text-secondary)] font-mono">{member.projects.join(', ') || 'No project access'}</td>
                <td className="py-3.5 text-right">
                  <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors">
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
