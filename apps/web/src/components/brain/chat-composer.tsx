"use client";

import { ArrowUp } from "lucide-react";

type ChatComposerProps = {
  query: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

export function ChatComposer({ query, busy, onChange, onSubmit }: ChatComposerProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(query);
      }}
      className="shrink-0 border-t-2 border-black bg-white p-3"
    >
      <div className="flex gap-2 border-2 border-black bg-white p-2 shadow-[4px_4px_0_black]">
        <input
          value={query}
          onChange={(event) => onChange(event.target.value)}
          disabled={busy}
          className="min-w-0 flex-1 bg-transparent px-3 outline-none disabled:opacity-50"
          placeholder="Ask TeamGraph..."
        />
        <button
          type="submit"
          disabled={busy || !query.trim()}
          aria-label={busy ? "Working" : "Send message"}
          className="grid h-11 w-11 place-items-center border-2 border-black bg-[var(--lime)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </form>
  );
}
