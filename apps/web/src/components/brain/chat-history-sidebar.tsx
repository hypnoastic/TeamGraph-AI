"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import type { BrainConversationSummary } from "@/lib/types";

type ChatHistorySidebarProps = {
  conversations: BrainConversationSummary[];
  activeConversationId: string | null;
  loading: boolean;
  onSelect: (conversationId: string) => void;
  onOpenNewChat: () => void;
  onDelete: (conversationId: string) => void;
};

export function ChatHistorySidebar({
  conversations,
  activeConversationId,
  loading,
  onSelect,
  onOpenNewChat,
  onDelete,
}: ChatHistorySidebarProps) {
  return (
    <>
      <div className="border-b-2 border-black p-4">
        <div className="mono text-[10px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">Chats</div>
        <button type="button" onClick={onOpenNewChat} className="btn-primary mt-3 w-full text-xs">
          <MessageSquarePlus size={14} /> New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && !conversations.length ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-12 animate-pulse border-2 border-black/10 bg-black/5" />
            ))}
          </div>
        ) : null}
        {!loading && !conversations.length ? (
          <div className="empty-state m-2 text-xs">No saved chats yet.</div>
        ) : null}
        {conversations.map((conversation) => {
          const selected = conversation.id === activeConversationId;
          return (
            <div
              key={conversation.id}
              className={`mb-1 flex items-start gap-2 border-2 p-2 ${selected ? "border-black bg-[var(--lime)] shadow-[2px_2px_0_black]" : "border-transparent hover:border-black/30"}`}
            >
              <button type="button" onClick={() => onSelect(conversation.id)} className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-bold">{conversation.title}</div>
                <div className="mono text-[10px] text-[var(--muted)]">{conversation.message_count} messages</div>
              </button>
              <button
                type="button"
                aria-label={`Delete ${conversation.title}`}
                onClick={() => onDelete(conversation.id)}
                className="shrink-0 pt-0.5"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
