"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Brain, Network, Inbox, ShieldCheck, Key, Plug, Users, Activity, Settings, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('teamgraph_user');
    if (!userData) {
      router.push('/login');
    } else {
      setUser(JSON.parse(userData));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('teamgraph_token');
    localStorage.removeItem('teamgraph_user');
    router.push('/login');
  };

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

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[var(--color-background-base)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-[var(--color-border-subtle)] flex flex-col bg-[var(--color-background-surface)]">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <div className="text-xs flex items-center space-x-2">
            <span className="text-[var(--color-text-secondary)]">{user.email}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
              {user.role}
            </span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user.role !== 'admin') return null;
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path} 
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[var(--color-card-hover)] text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)] hover:text-[var(--color-text-primary)]'}`}
              >
                <Icon size={18} className={isActive ? 'text-[var(--color-accent-brain)]' : ''} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <button onClick={handleLogout} className="flex items-center space-x-3 px-3 py-2 w-full text-left rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-card-base)] transition-colors">
            <LogOut size={18} />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
