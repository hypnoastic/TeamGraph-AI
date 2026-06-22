"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { ActivityRecord } from "@/lib/types";

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityRecord[]>([]);
  useEffect(() => { apiGet<ActivityRecord[]>("/activity").then(setItems).catch(() => setItems([])); }, []);
  return <PageShell title="Activity"><section className="panel overflow-hidden">{items.length ? items.map((item) => <div key={item.id} className="grid gap-2 border-b border-black/30 p-4 last:border-0 md:grid-cols-[170px_1fr]"><time className="mono text-[10px]">{new Date(item.createdAt).toLocaleString()}</time><div><b>{item.title}</b><p className="text-sm text-[var(--muted)]">{item.description}</p></div></div>) : <div className="empty-state m-4">No activity yet.</div>}</section></PageShell>;
}
