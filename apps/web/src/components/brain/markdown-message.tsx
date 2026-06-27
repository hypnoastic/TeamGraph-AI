"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BrainCitation } from "@/lib/types";

const CITE_TOKEN_PREFIX = "CITATION_TOKEN_";

type MarkdownMessageProps = {
  text: string;
  citations?: BrainCitation[];
  onSelectCitation?: (citation: BrainCitation, index: number) => void;
  className?: string;
};

function preprocessCitations(text: string) {
  return text.replace(/\[(\d+)\]/g, (_, index: string) => `${CITE_TOKEN_PREFIX}${index}${CITE_TOKEN_PREFIX}`);
}

function renderWithCitationTokens(
  children: React.ReactNode,
  citations: BrainCitation[],
  onSelectCitation?: (citation: BrainCitation, index: number) => void,
): React.ReactNode {
  if (typeof children === "string") {
    const parts = children.split(new RegExp(`(${CITE_TOKEN_PREFIX}\\d+${CITE_TOKEN_PREFIX})`, "g"));
    return parts.map((part, partIndex) => {
      const match = part.match(new RegExp(`${CITE_TOKEN_PREFIX}(\\d+)${CITE_TOKEN_PREFIX}`));
      if (!match) return part;
      const index = Number(match[1]);
      const citation = citations[index - 1];
      if (!citation || !onSelectCitation) return `[${index}]`;
      return (
        <button
          key={`cite-${partIndex}-${index}`}
          type="button"
          onClick={() => onSelectCitation(citation, index)}
          className="mx-0.5 inline-flex items-center rounded-sm border border-black bg-[var(--cyan)] px-1 py-0.5 text-[10px] font-black align-middle"
        >
          [{index}]
        </button>
      );
    });
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => (
      <span key={index}>{renderWithCitationTokens(child, citations, onSelectCitation)}</span>
    ));
  }

  return children;
}

export function MarkdownMessage({ text, citations = [], onSelectCitation, className = "" }: MarkdownMessageProps) {
  const processed = preprocessCitations(text);

  return (
    <div className={`brain-markdown text-sm leading-6 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{renderWithCitationTokens(children, citations, onSelectCitation)}</p>,
          strong: ({ children }) => <strong className="font-black">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{renderWithCitationTokens(children, citations, onSelectCitation)}</li>,
          h1: ({ children }) => <h1 className="mb-2 text-xl font-black">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-lg font-black">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 text-base font-black">{children}</h3>,
          code: ({ children }) => (
            <code className="mono rounded-sm border border-black/20 bg-black/5 px-1 py-0.5 text-[12px]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mono mb-3 overflow-x-auto border-2 border-black bg-[var(--paper)] p-3 text-xs">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a href={href} className="font-bold underline" target="_blank" rel="noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
