"use client";

import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet, apiPost } from "@/lib/api";
import type { SettingsResponse } from "@/lib/types";

export default function SettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  useEffect(() => { apiGet<SettingsResponse>("/settings").then(setData).catch(() => setData(null)); }, []);
  const values = data ? [["Graphiti", data.graphiti_mode], ["Neo4j", data.neo4j_status], ["Postgres", data.postgres_status], ["Provider", data.graphiti_provider], ["Pending", data.pending_approvals], ["Quarantined", data.quarantined_count]] : [];
  return <PageShell title="Settings" actions={<button className="btn-primary" onClick={async () => { await apiPost("/settings/optimize", {}); setData(await apiGet("/settings")); }}><Zap size={15} /> Optimize</button>}><section className="panel grid sm:grid-cols-2 lg:grid-cols-3">{values.map(([label, value], index) => <div key={String(label)} className={`p-5 ${index < values.length - 1 ? "border-b-2 border-black lg:border-r-2" : ""}`}><div className="mono text-[10px] font-bold uppercase">{label}</div><div className="mt-2 text-2xl font-black">{String(value)}</div></div>)}</section></PageShell>;
}
