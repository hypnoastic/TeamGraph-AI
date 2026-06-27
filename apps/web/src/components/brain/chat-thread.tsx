"use client";

import { Brain } from "lucide-react";
import { useEffect, useState } from "react";
import type { BrainCitation } from "@/lib/types";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { ChatMessage } from "@/hooks/use-brain-chats";
import { CitationChip } from "@/components/brain/citation-chip";
import { MarkdownMessage } from "@/components/brain/markdown-message";
import { ThinkingBubble } from "@/components/brain/thinking-bubble";

type ChatThreadProps = {
  messages: ChatMessage[];
  loading: boolean;
  busy: boolean;
  conversations?: Array<{ id: string; title: string }>;
  activeConversationId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
  onOpenNewChat?: () => void;
  onPrompt: (prompt: string) => void;
  onSelectCitation: (citation: BrainCitation, index: number) => void;
  selectedCitationIndex: number | null;
};

function ThreadSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div key={item} className={`animate-pulse border-2 border-black/10 bg-black/5 p-4 ${item % 2 ? "ml-auto w-2/3" : "w-4/5"}`} />
      ))}
    </div>
  );
}

function AssistantMessage({
  message,
  onSelectCitation,
  selectedCitationIndex,
}: {
  message: ChatMessage;
  onSelectCitation: (citation: BrainCitation, index: number) => void;
  selectedCitationIndex: number | null;
}) {
  const [animate, setAnimate] = useState(Boolean(message.animate));
  const displayText = useTypewriter(message.text, animate);

  useEffect(() => {
    if (!animate) return;
    const timer = window.setTimeout(() => setAnimate(false), Math.min(message.text.length * 24, 6000));
    return () => window.clearTimeout(timer);
  }, [animate, message.text.length]);

  return (
    <article className="max-w-[92%] border-l-4 border-black pl-4">
      <div className="mono mb-2 text-[10px] font-bold uppercase">
        TeamGraph · {message.answer?.mode || "error"}
      </div>
      {message.error ? (
        <p className="font-bold text-red-700 text-sm leading-6">{displayText}</p>
      ) : (
        <MarkdownMessage
          text={displayText}
          citations={message.answer?.citations}
          onSelectCitation={onSelectCitation}
        />
      )}
      {message.answer?.citations?.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {message.answer.citations.map((citation, citationIndex) => (
            <CitationChip
              key={`${citation.title}-${citationIndex}`}
              citation={citation}
              index={citationIndex + 1}
              selected={selectedCitationIndex === citationIndex + 1}
              onSelect={onSelectCitation}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function ChatThread({
  messages,
  loading,
  busy,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onOpenNewChat,
  onPrompt,
  onSelectCitation,
  selectedCitationIndex,
}: ChatThreadProps) {
  const prompts = ["What changed this week?", "Prepare a project handoff", "Find recent decisions"];
  const showEmpty = !loading && !messages.length;
  const showMessages = messages.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {conversations.length && onSelectConversation ? (
        <div className="flex gap-2 border-b-2 border-black bg-[#f7f2ea] p-3 md:hidden">
          <select
            className="input-field flex-1 py-2 text-xs"
            value={activeConversationId || ""}
            onChange={(event) => onSelectConversation(event.target.value)}
          >
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title}
              </option>
            ))}
          </select>
          {onOpenNewChat ? (
            <button type="button" className="btn-secondary px-3 text-xs" onClick={onOpenNewChat}>
              New
            </button>
          ) : null}
        </div>
      ) : null}
      <div className={`flex-1 overflow-y-auto p-5 ${loading && showMessages ? "opacity-80" : ""}`}>
        {loading && !showMessages ? <ThreadSkeleton /> : null}
        {showEmpty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="border-2 border-black bg-[var(--purple)] p-4 shadow-[6px_6px_0_black]">
              <Brain size={34} />
            </div>
            <h1 className="mt-7 text-3xl font-black tracking-[-.06em]">Ask your organization.</h1>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {prompts.map((item) => (
                <button
                  key={item}
                  type="button"
                  disabled={busy}
                  className="btn-secondary text-xs disabled:opacity-50"
                  onClick={() => onPrompt(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {showMessages ? (
          <div className="space-y-5">
            {messages.map((message) =>
              message.status === "thinking" ? (
                <ThinkingBubble key={message.id} />
              ) : message.role === "user" ? (
                <article
                  key={message.id}
                  className="ml-auto max-w-[80%] border-2 border-black bg-[var(--yellow)] p-4 shadow-[4px_4px_0_black]"
                >
                  <div className="mono mb-2 text-[10px] font-bold uppercase">You</div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                </article>
              ) : (
                <AssistantMessage
                  key={message.id}
                  message={message}
                  onSelectCitation={onSelectCitation}
                  selectedCitationIndex={selectedCitationIndex}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
