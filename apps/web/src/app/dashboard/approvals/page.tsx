"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet, apiPost } from "@/lib/api";
import type { InboxItem } from "@/lib/types";

type ApprovalResponse = Pick<InboxItem, "raw" | "review_item">;

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalResponse[]>([]);
  const refresh = () => apiGet<ApprovalResponse[]>("/approvals/").then(setItems).catch(() => setItems([]));
  useEffect(() => { apiGet<ApprovalResponse[]>("/approvals/").then(setItems).catch(() => setItems([])); }, []);

  const decide = async (id: string, action: "approve" | "reject") => {
    await apiPost(`/approvals/${id}/${action}`, {});
    await refresh();
  };

  return (
    <PageShell title="Approval queue" description="Risky context stays outside Graphiti until an admin decides.">
      <section className="panel overflow-hidden">
        {items.length ? items.map((item) => item.review_item && (
          <article key={item.review_item.id} className="border-b-2 border-black p-5 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="text-lg font-black">{item.raw.title}</h2><div className="mono mt-1 text-[10px]">{item.review_item.riskTags.join(" · ") || "manual review"}</div></div>
              <span className="badge badge-review">Review</span>
            </div>
            <p className="my-4 border-l-4 border-black pl-4 text-sm">{item.raw.content}</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => decide(item.review_item!.id, "reject")} className="btn-danger"><X size={15} /> Reject</button>
              <button onClick={() => decide(item.review_item!.id, "approve")} className="btn-primary bg-[var(--lime)]"><Check size={15} /> Approve</button>
            </div>
          </article>
        )) : <div className="empty-state m-4">Queue clear.</div>}
      </section>
    </PageShell>
  );
}
