"use client";

import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { LoadingButton } from "@/components/loading-button";
import { apiGet, apiPost } from "@/lib/api";
import { getPageCache, setPageCache } from "@/lib/page-cache";
import type { InboxItem, Project } from "@/lib/types";

const INBOX_CACHE_KEY = "context-inbox";
const PROJECTS_CACHE_KEY = "context-projects";

export default function ContextInboxPage() {
  const [items, setItems] = useState<InboxItem[]>(() => getPageCache<InboxItem[]>(INBOX_CACHE_KEY) || []);
  const [projects, setProjects] = useState<Project[]>(() => getPageCache<Project[]>(PROJECTS_CACHE_KEY) || []);
  const [refreshing, setRefreshing] = useState(!getPageCache<InboxItem[]>(INBOX_CACHE_KEY));
  const [form, setForm] = useState({ title: "", content: "", project: "", visibility: "project", type: "note" });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const refresh = () =>
    apiGet<InboxItem[]>("/context/inbox")
      .then((next) => {
        setPageCache(INBOX_CACHE_KEY, next);
        setItems(next);
      })
      .catch(() => setItems((current) => current));

  useEffect(() => {
    setRefreshing(!getPageCache<InboxItem[]>(INBOX_CACHE_KEY));
    refresh().finally(() => setRefreshing(false));
    apiGet<Project[]>("/projects")
      .then((data) => {
        setPageCache(PROJECTS_CACHE_KEY, data);
        setProjects(data);
        if (data[0]) setForm((current) => ({ ...current, project: data[0].id }));
      })
      .catch(() => setProjects((current) => current));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await apiPost<{ decision: string }>("/context/upload", {
        ...form,
        project: form.visibility === "org" ? null : form.project,
        sourceType: "ui_upload",
        upload_channel: "ui",
      });
      setNotice(response.decision === "auto_curate" ? "Added to the live brain." : "Sent to approval.");
      setForm((current) => ({ ...current, title: "", content: "" }));
      await refresh();
    } catch {
      setNotice("Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Context inbox" description="Add trusted memory or review recent ingestion." actions={refreshing ? <span className="badge">Updating...</span> : undefined}>
      <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <form onSubmit={submit} className="panel h-fit p-5">
          <h2 className="mb-4 text-lg font-black">Add context</h2>
          <input className="input-field mb-3" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="input-field mb-3 min-h-44 resize-y" placeholder="Paste notes, decisions, or a handoff..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="project">Project</option><option value="org">Organization</option><option value="private">Private</option>
            </select>
            <select className="input-field" disabled={form.visibility === "org"} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </div>
          {notice && <div className="mono mt-3 text-xs font-bold">{notice}</div>}
          <LoadingButton type="submit" busy={busy} busyLabel="Working..." label="Upload" className="btn-primary mt-4 w-full"><Upload size={16} /></LoadingButton>
        </form>
        <section className="panel overflow-hidden">
          <div className="border-b-2 border-black p-4 font-black">Recent ingestion</div>
          {items.length ? items.map((item) => (
            <article key={item.raw.id} className="border-b border-black/30 p-4 last:border-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-black">{item.raw.title}</h3><div className="mono mt-1 text-[10px] text-[var(--muted)]">{item.raw.projectRequested || "Organization"} · {item.raw.sourceType}</div></div>
                <span className={`badge ${item.lane === "auto_curated" ? "badge-safe" : item.lane === "quarantined" ? "badge-danger" : "badge-review"}`}>{item.lane.replace("_", " ")}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-[var(--muted)]">{item.raw.content}</p>
            </article>
          )) : <div className="empty-state m-4">No context yet.</div>}
        </section>
      </div>
    </PageShell>
  );
}
