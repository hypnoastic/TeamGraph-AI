"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, Brain, ChevronRight, Code2, FolderKanban, Inbox, Key, LayoutDashboard, LogOut, Menu, Network, Plug, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import type { HealthResponse, SessionUser } from "@/lib/types";

const navItems = [
  { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/dashboard/projects", icon: FolderKanban },
  { name: "Brain Chat", path: "/dashboard/brain", icon: Brain },
  { name: "Graph", path: "/dashboard/graph", icon: Network },
  { name: "Context", path: "/dashboard/context", icon: Inbox },
  { name: "Approvals", path: "/dashboard/approvals", icon: ShieldCheck, adminOnly: true },
  { name: "Team", path: "/dashboard/team", icon: Users, adminOnly: true },
  { name: "API Keys", path: "/dashboard/api-keys", icon: Key },
  { name: "Connectors", path: "/dashboard/connectors", icon: Plug },
  { name: "Activity", path: "/dashboard/activity", icon: Activity },
  { name: "Settings", path: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("teamgraph_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  });
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("teamgraph_user");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const stored = JSON.parse(raw) as SessionUser;
    if (stored.onboarding_required) {
      router.replace("/onboarding");
      return;
    }
    apiGet<SessionUser>("/auth/me").then((fresh) => {
      localStorage.setItem("teamgraph_user", JSON.stringify(fresh));
      setUser(fresh);
    }).catch((err: any) => {
      if (err?.response?.status === 401) {
        localStorage.removeItem("teamgraph_token");
        localStorage.removeItem("teamgraph_user");
        router.replace("/login");
      }
    });
    apiGet<HealthResponse>("/health", false).then(setHealth).catch(() => setHealth(null));
  }, [router]);

  const logout = async () => {
    await apiPost("/auth/logout", {}).catch(() => undefined);
    localStorage.removeItem("teamgraph_token");
    localStorage.removeItem("teamgraph_user");
    router.replace("/login");
  };

  if (!user) return <div className="min-h-screen bg-[var(--paper)]" />;

  const active = navItems.find((item) => item.path === pathname) ?? navItems.find((item) => item.path !== "/dashboard" && pathname.startsWith(item.path)) ?? navItems[0];

  const navigation = (
    <>
      <Link href="/dashboard" className="flex h-16 items-center border-b-2 border-white px-5 text-xl font-black tracking-[-.05em] text-[var(--paper)]">
        TEAMGRAPH<span className="text-[var(--cyan)]">.</span>
      </Link>
      <nav className="flex-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          if (item.adminOnly && user.role !== "admin") return null;
          const selected = item.path === "/dashboard" ? pathname === item.path : pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link key={item.path} href={item.path} onClick={() => setOpen(false)} className={`mb-1 flex items-center gap-3 border-2 px-3 py-2.5 text-sm font-bold ${selected ? "border-black bg-[var(--lime)] text-black shadow-[3px_3px_0_white]" : "border-transparent text-white hover:border-white"}`}>
              <Icon size={17} strokeWidth={2.5} />
              <span>{item.name}</span>
              {selected && <ChevronRight size={15} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t-2 border-white p-4 text-white">
        <div className="mb-3 flex gap-2">
          <span className={`h-2.5 w-2.5 border border-black ${health?.graphiti.mode === "live" && health?.neo4j.status === "ok" ? "bg-[var(--lime)]" : "bg-[var(--yellow)]"}`} />
          <span className="mono text-[10px] uppercase">{health?.graphiti.mode || "checking"} brain</span>
        </div>
        <div className="truncate text-sm font-bold">{user.name}</div>
        <div className="mono mb-3 truncate text-[10px] text-white/60">{user.org_name}</div>
        <button onClick={logout} className="flex items-center gap-2 text-xs font-bold"><LogOut size={14} /> Log out</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-black lg:flex">{navigation}</aside>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-black transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setOpen(false)} className="absolute right-4 top-5 text-white"><X /></button>
        {navigation}
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-black bg-[var(--surface)] px-4 md:px-7">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" onClick={() => setOpen(true)} className="border-2 border-black bg-[var(--yellow)] p-1.5 lg:hidden"><Menu size={18} /></button>
            <h1 className="text-lg font-black tracking-[-.03em]">{active.name}</h1>
          </div>
          <span className="badge">{user.role}</span>
        </header>
        <main className="p-4 md:p-7">{children}</main>
      </div>
    </div>
  );
}
