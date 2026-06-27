"use client";

import { Copy, Key, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { ApiKeyRecord } from "@/lib/types";

const scopes = ["context.read", "context.write", "graph.optimize"];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [purpose, setPurpose] = useState("MCP agent");
  const [selected, setSelected] = useState(["context.read", "context.write"]);
  const [rawKey, setRawKey] = useState("");
  const refresh = () => apiGet<ApiKeyRecord[]>("/api-keys").then(setKeys).catch(() => setKeys([]));
  useEffect(() => { apiGet<ApiKeyRecord[]>("/api-keys").then(setKeys).catch(() => setKeys([])); }, []);

  const create = async () => {
    const response = await apiPost<ApiKeyRecord>("/api-keys", { purpose, scopes: selected });
    setRawKey(response.raw_key || "");
    await refresh();
  };

  return (
    <PageShell title="API keys" description="Keys are hashed and the raw value is shown once.">
      <div className="grid gap-6 xl:grid-cols-[.65fr_1.35fr]">
        <section className="panel h-fit p-5">
          <h2 className="mb-4 font-black">New agent key</h2>
          <input className="input-field" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <div className="my-4 flex flex-wrap gap-2">{scopes.map((scope) => <button key={scope} onClick={() => setSelected((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope])} className={`badge ${selected.includes(scope) ? "badge-live" : ""}`}>{scope}</button>)}</div>
          <button onClick={create} className="btn-primary w-full"><Plus size={15} /> Create</button>
          {rawKey && <button onClick={() => navigator.clipboard.writeText(rawKey)} className="mono mt-4 flex w-full items-center gap-2 break-all border-2 border-black bg-[var(--lime)] p-3 text-left text-xs"><Copy size={15} className="shrink-0" /> {rawKey}</button>}
        </section>
        <section className="panel overflow-x-auto">
          <table className="data-table"><thead><tr><th>Key</th><th>Scopes</th><th>Last used</th><th /></tr></thead><tbody>{keys.map((item) => <tr key={item.id}><td><div className="flex items-center gap-2"><Key size={15} /><b>{item.purpose}</b></div><div className="mono text-[10px]">{item.key_prefix}••••••</div></td><td>{item.scopes.join(", ")}</td><td>{item.last_used_at ? new Date(item.last_used_at).toLocaleDateString() : "Never"}</td><td><button onClick={async () => { await apiDelete(`/api-keys/${item.id}`); await refresh(); }}><Trash2 size={16} /></button></td></tr>)}</tbody></table>
          {!keys.length && <div className="empty-state m-4">No active keys.</div>}
        </section>
      </div>
    </PageShell>
  );
}
