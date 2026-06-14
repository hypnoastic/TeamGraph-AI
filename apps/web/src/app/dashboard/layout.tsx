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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,245,212,0.08),_transparent_35%),linear-gradient(180deg,_#040505_0%,_#090b0d_45%,_#050505_100%)] text-[var(--color-text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex w-76 border-r border-[var(--color-border-subtle)] bg-[rgba(7,8,10,0.86)] backdrop-blur-xl flex-col">
          <div className="p-6 border-b border-[var(--color-border-subtle)] space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[rgba(0,245,212,0.14)] border border-[rgba(0,245,212,0.28)] flex items-center justify-center">
                <Sparkles size={20} className="text-[var(--color-accent-brain)]" />
              </div>
              <div>
                <div className="font-semibold tracking-tight text-lg">TeamGraph</div>
                <div className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Live Brain Ops</div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 p-4">
              <div className="text-sm font-medium">{user.name || user.email}</div>
              <div className="text-xs text-[var(--color-text-secondary)] mt-1">{user.email}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] bg-[rgba(0,245,212,0.14)] text-[var(--color-accent-brain)] border border-[rgba(0,245,212,0.22)]">
                  {user.role}
                </span>
                {user.is_demo && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] bg-[rgba(245,158,11,0.14)] text-[var(--color-accent-review)] border border-[rgba(245,158,11,0.22)]">
                    demo account
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Graphiti</div>
                <div className="mt-2 font-medium text-[var(--color-accent-brain)]">{health?.graphiti.mode || 'unknown'}</div>
                <div className="text-[var(--color-text-secondary)] mt-1">{health?.graphiti.provider || 'n/a'}</div>
              </div>
              <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 p-4">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Infra</div>
                <div className="mt-2 text-[var(--color-text-secondary)]">Postgres: {health?.postgres.status || 'unknown'}</div>
                <div className="text-[var(--color-text-secondary)] mt-1">Neo4j: {health?.neo4j.status || 'unknown'}</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-1.5">
            {navItems.map((item) => {
              if (item.adminOnly && user.role !== 'admin') return null;
              const isActive = pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-[rgba(0,245,212,0.12)] text-[var(--color-text-primary)] border border-[rgba(0,245,212,0.22)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)] hover:text-[var(--color-text-primary)] border border-transparent'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-[var(--color-accent-brain)]' : ''} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--color-border-subtle)] bg-[rgba(7,8,10,0.82)] backdrop-blur-xl">
            <div className="max-w-[1600px] mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Workspace</div>
                <div className="text-lg md:text-2xl font-semibold tracking-tight">{activeItem.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent-brain)]" />
                  Graphiti {health?.graphiti.mode || 'unknown'}
                </div>
                <div className="hidden md:flex items-center gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent-safe)]" />
                  Neo4j {health?.neo4j.status || 'unknown'}
                </div>
                <div className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/80 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                  {user.email}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
