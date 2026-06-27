"use client";

import { Database } from "lucide-react";
import type { BrainCitation } from "@/lib/types";

type CitationChipProps = {
  citation: BrainCitation;
  index: number;
  selected?: boolean;
  onSelect: (citation: BrainCitation, index: number) => void;
};

export function CitationChip({ citation, index, selected, onSelect }: CitationChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(citation, index)}
      className={`border-2 p-3 text-left text-xs transition ${selected ? "border-black bg-[var(--yellow)] shadow-[3px_3px_0_black]" : "border-black bg-white hover:bg-[var(--paper)]"}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <Database size={13} />
        <span className="mono font-bold">[{index}]</span>
      </div>
      <b>{citation.title}</b>
      {citation.summary ? <p className="mt-1 line-clamp-3 text-[var(--muted)]">{citation.summary}</p> : null}
    </button>
  );
}

function citationRef(citation: BrainCitation): string | null {
  return citation.context_id || citation.graphiti_episode_uuid || null;
}

export function hasCitationRef(citation: BrainCitation): boolean {
  return Boolean(citationRef(citation));
}

export { citationRef };
