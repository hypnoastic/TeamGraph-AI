"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { BrainCitation, BrainSourceDetail } from "@/lib/types";

type CitationInspectorProps = {
  open: boolean;
  loading: boolean;
  citation: BrainCitation | null;
  detail: BrainSourceDetail | null;
  onClose: () => void;
};

export function CitationInspector({ open, loading, citation, detail, onClose }: CitationInspectorProps) {
  if (!open) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-[var(--muted)]">
        Select a citation to inspect its source.
      </div>
    );
  }

  if (!citation) return null;

  return (
    <>
      <div className="flex items-center justify-between border-b-2 border-black p-4">
        <div>
          <div className="mono text-[10px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Source detail</div>
          <h2 className="mt-1 text-lg font-black leading-tight">{detail?.title || citation.title}</h2>
        </div>
        <button type="button" aria-label="Close source detail" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <div className="empty-state text-sm">Loading source...</div> : null}
        {!loading && detail ? (
          <div className="space-y-4 text-sm">
            {detail.summary ? (
              <section>
                <div className="mono mb-1 text-[10px] font-bold uppercase">Summary</div>
                <p>{detail.summary}</p>
              </section>
            ) : null}
            <section className="grid grid-cols-2 gap-3">
              <Meta label="Project" value={detail.project_name || "Organization"} />
              <Meta label="Source" value={detail.source_type || "unknown"} />
              <Meta label="Type" value={detail.context_type || "note"} />
              <Meta label="Uploaded" value={detail.created_at ? new Date(detail.created_at).toLocaleString() : "Unknown"} />
            </section>
            {detail.uploader_name || detail.uploader_email ? (
              <Meta label="Uploader" value={[detail.uploader_name, detail.uploader_email].filter(Boolean).join(" · ")} />
            ) : null}
            {detail.tags.length ? (
              <section className="flex flex-wrap gap-2">
                {detail.tags.map((tag) => (
                  <span key={tag} className="badge">{tag}</span>
                ))}
              </section>
            ) : null}
            {detail.content ? (
              <section>
                <div className="mono mb-1 text-[10px] font-bold uppercase">Content</div>
                <div className="max-h-72 overflow-y-auto border-2 border-black bg-[var(--paper)] p-3 text-xs leading-6 whitespace-pre-wrap">
                  {detail.content}
                </div>
              </section>
            ) : null}
            {detail.context_id ? (
              <Link href="/dashboard/context" className="btn-secondary w-full text-xs">
                Open context inbox
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono text-[10px] font-bold uppercase text-[var(--muted)]">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}
