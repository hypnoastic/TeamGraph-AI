"use client";

import { useEffect, useState } from 'react';
import { Mail, MoreHorizontal } from 'lucide-react';

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
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center">Team Members</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Manage access to the organization brain.</p>
        </div>
      </div>

      <div className="border border-[var(--color-border-subtle)] rounded-xl overflow-hidden bg-[var(--color-card-base)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-background-surface)] text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
            <tr>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium">Projects</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {team.map((member) => (
              <tr key={member.id} className="hover:bg-[var(--color-card-hover)] transition-colors">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-background-surface)] flex items-center justify-center font-bold text-xs text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--color-text-primary)]">{member.name}</div>
                      <div className="text-[var(--color-text-muted)] text-xs flex items-center mt-0.5">
                        <Mail size={10} className="mr-1" /> {member.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium border ${
                      member.role === 'admin'
                        ? 'bg-purple-900/20 text-[var(--color-accent-mcp)] border-purple-900/50'
                        : 'bg-blue-900/20 text-blue-400 border-blue-900/50'
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="p-4 text-[var(--color-text-secondary)]">{member.projects.join(', ') || 'No project access'}</td>
                <td className="p-4 text-right">
                  <button className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] p-1 rounded transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
