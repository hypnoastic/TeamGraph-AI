"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Brain,
  Inbox,
  Key,
  LogOut,
  Network,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { apiGet } from '@/lib/api';
import type { HealthResponse } from '@/lib/types';

const navItems = [
  { name: 'Brain Chat', path: '/dashboard/brain', icon: Brain },
  { name: 'Graph', path: '/dashboard/graph', icon: Network },
  { name: 'Context Inbox', path: '/dashboard/context', icon: Inbox },
  { name: 'Approvals', path: '/dashboard/approvals', icon: ShieldCheck, adminOnly: true },
  { name: 'API Keys', path: '/dashboard/api-keys', icon: Key },
  { name: 'Connectors', path: '/dashboard/connectors', icon: Plug },
  { name: 'Team', path: '/dashboard/team', icon: Users, adminOnly: true },
  { name: 'Activity', path: '/dashboard/activity', icon: Activity },
  { name: 'Settings', path: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('teamgraph_user');
    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    apiGet<HealthResponse>('/health', false)
      .then(setHealth)
      .catch(() => setHealth(null));
  }, [router]);

  const activeItem = useMemo(
    () => navItems.find((item) => pathname.startsWith(item.path)) ?? navItems[0],
    [pathname]
  );

  const handleLogout = () => {
    localStorage.removeItem('teamgraph_token');
    localStorage.removeItem('teamgraph_user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050506] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-64 border-r border-[var(--color-border-subtle)] bg-[#07080A] flex-col">
          <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--color-accent-brain)]" />
            <span className="font-semibold tracking-tight text-base">TeamGraph</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            {navItems.map((item) => {
              if (item.adminOnly && user.role !== 'admin') return null;
              const isActive = pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'text-[var(--color-text-primary)] bg-[var(--color-card-base)]/50'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)]/30 hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[var(--color-accent-brain)]' : 'text-[var(--color-text-secondary)]'} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-border-subtle)] flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate text-[var(--color-text-primary)]">{user.name || 'Member'}</div>
                <div className="text-[10px] text-[var(--color-text-secondary)] truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex gap-4 px-2 text-[9px] text-[var(--color-text-muted)] uppercase tracking-wider font-mono">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${health?.graphiti.mode ? 'bg-[var(--color-accent-brain)]' : 'bg-red-500'}`} />
                Graphiti
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${health?.neo4j.status === 'healthy' ? 'bg-[var(--color-accent-safe)]' : 'bg-red-500'}`} />
                Neo4j
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)]/50 hover:text-[var(--color-text-primary)] transition-colors text-xs"
            >
              <LogOut size={14} />
              <span className="font-medium">Log out</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)]/50 bg-[#050506]/80 backdrop-blur-md">
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">{activeItem.name}</h1>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/30 font-mono">
                {user.role} mode
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
