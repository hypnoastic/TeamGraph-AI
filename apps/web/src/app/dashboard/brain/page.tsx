"use client";

import { ArrowUp, Brain, Database } from "lucide-react";
import { useRef, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiPost } from "@/lib/api";
import type { BrainResponse } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string; answer?: BrainResponse; error?: boolean };

export default function BrainPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = query.trim();
    if (!text || busy) return;
    setMessages((current) => [...current, { role: "user", text }]);
    setQuery("");
    setBusy(true);
    try {
      const answer = await apiPost<BrainResponse>("/brain/query", { query: text });
      setMessages((current) => [...current, { role: "assistant", text: answer.answer, answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "The brain is unavailable.", error: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="mx-auto flex min-h-[calc(100vh-130px)] max-w-4xl flex-col">
        {!messages.length && <div className="flex flex-1 flex-col items-center justify-center text-center"><div className="border-2 border-black bg-[var(--purple)] p-4 shadow-[6px_6px_0_black]"><Brain size={34} /></div><h1 className="mt-7 text-4xl font-black tracking-[-.06em]">Ask your organization.</h1><div className="mt-6 flex flex-wrap justify-center gap-2">{["What changed this week?", "Prepare a project handoff", "Find recent decisions"].map((item) => <button key={item} className="btn-secondary text-xs" onClick={() => { setQuery(item); setTimeout(() => formRef.current?.requestSubmit(), 0); }}>{item}</button>)}</div></div>}
        {!!messages.length && <div className="flex-1 space-y-5 pb-6">{messages.map((message, index) => <article key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[80%] border-2 border-black bg-[var(--yellow)] p-4 shadow-[4px_4px_0_black]" : "max-w-[90%] border-l-4 border-black pl-4"}><div className="mono mb-2 text-[10px] font-bold uppercase">{message.role === "user" ? "You" : `TeamGraph · ${message.answer?.mode || "error"}`}</div><p className={message.error ? "font-bold text-red-700" : "whitespace-pre-wrap text-sm leading-6"}>{message.text}</p>{message.answer?.citations?.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{message.answer.citations.map((citation, citationIndex) => <div key={`${citation.title}-${citationIndex}`} className="border-2 border-black bg-white p-3 text-xs"><Database size={13} className="mb-2" /><b>{citation.title}</b></div>)}</div> : null}</article>)}</div>}
        <form ref={formRef} onSubmit={ask} className="sticky bottom-4 flex border-2 border-black bg-white p-2 shadow-[6px_6px_0_black]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent px-3 outline-none" placeholder="Ask TeamGraph..." />
          <button disabled={busy || !query.trim()} className="grid h-11 w-11 place-items-center border-2 border-black bg-[var(--lime)]"><ArrowUp size={18} /></button>
        </form>
      </div>
    </PageShell>
  );
}
