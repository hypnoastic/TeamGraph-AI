"use client";

import Link from "next/link";
import { ArrowUpRight, Brain, Inbox, Key, Network } from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => { apiGet<DashboardSummary>("/dashboard/summary").then(setData).catch(() => setData(null)); }, []);

  const stats = [
    ["Trusted memory", data?.trusted_memories ?? "—", "bg-[var(--lime)]"],
    ["Pending", data?.pending_approvals ?? "—", "bg-[var(--yellow)]"],
    ["Projects", data?.projects ?? "—", "bg-[var(--cyan)]"],
    ["Agent keys", data?.agent_keys ?? "—", "bg-[var(--coral)]"],
  ];

  return (
    <PageShell title="Organization brain" actions={<Link href="/dashboard/context" className="btn-primary"><Inbox size={16} /> Add context</Link>}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, color]) => (
          <div key={String(label)} className={`panel p-5 ${color}`}>
            <div className="mono text-[11px] font-bold uppercase">{label}</div>
            <div className="mt-3 text-4xl font-black">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b-2 border-black p-4">
            <h2 className="font-black">Recent memory</h2>
            <Link href="/dashboard/graph" className="mono text-xs font-bold">Open graph ↗</Link>
          </div>
          {data?.recent_context?.length ? data.recent_context.map((item) => (
            <div key={item.id} className="flex items-center gap-3 border-b border-black/30 px-4 py-3 last:border-0">
              <span className="h-9 w-9 shrink-0 border-2 border-black bg-[var(--purple)]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{item.title}</div>
                <div className="mono truncate text-[10px] text-[var(--muted)]">{item.project || "Organization"} · {item.source}</div>
              </div>
              <span className="badge">{item.type}</span>
            </div>
          )) : <div className="empty-state m-4">No context yet.</div>}
        </section>
        <section className="grid gap-3">
          {[
            ["/dashboard/brain", Brain, "Ask the brain", "bg-[var(--purple)]"],
            ["/dashboard/graph", Network, "Explore graph", "bg-[var(--cyan)]"],
            ["/dashboard/api-keys", Key, "Connect an agent", "bg-[var(--yellow)]"],
          ].map(([href, Icon, label, color]) => (
            <Link key={String(href)} href={String(href)} className={`panel flex items-center gap-4 p-5 ${color}`}>
              <Icon size={24} /><span className="font-black">{String(label)}</span><ArrowUpRight className="ml-auto" size={18} />
            </Link>
          ))}
        </section>
      </div>
    </PageShell>
  );
}
