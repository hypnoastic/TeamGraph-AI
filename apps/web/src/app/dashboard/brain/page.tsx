"use client";

import { useCallback, useState } from "react";
import { BrainChatLayout } from "@/components/brain/brain-chat-layout";
import { ChatComposer } from "@/components/brain/chat-composer";
import { ChatHistorySidebar } from "@/components/brain/chat-history-sidebar";
import { ChatThread } from "@/components/brain/chat-thread";
import { CitationInspector } from "@/components/brain/citation-inspector";
import { citationRef } from "@/components/brain/citation-chip";
import { useBrainChats } from "@/hooks/use-brain-chats";
import { apiGet } from "@/lib/api";
import type { BrainCitation, BrainSourceDetail } from "@/lib/types";

export default function BrainPage() {
  const [query, setQuery] = useState("");
  const [selectedCitation, setSelectedCitation] = useState<BrainCitation | null>(null);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);
  const [sourceDetail, setSourceDetail] = useState<BrainSourceDetail | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);

  const {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    busy,
    ask,
    loadConversation,
    startConversation,
    removeConversation,
  } = useBrainChats();

  const handleSelectCitation = useCallback(async (citation: BrainCitation, index: number) => {
    setSelectedCitation(citation);
    setSelectedCitationIndex(index);
    setSourceLoading(true);
    setSourceDetail(null);
    try {
      const ref = citationRef(citation);
      const detail = await apiGet<BrainSourceDetail>(`/brain/sources/${encodeURIComponent(ref)}`);
      setSourceDetail(detail);
    } catch {
      setSourceDetail(null);
    } finally {
      setSourceLoading(false);
    }
  }, []);

  const handleAsk = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQuery("");
    await ask(trimmed);
  };

  const handleNewChat = async () => {
    setSelectedCitation(null);
    setSelectedCitationIndex(null);
    setSourceDetail(null);
    await startConversation();
  };

  return (
    <BrainChatLayout
      sidebar={
        <ChatHistorySidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          loading={loadingConversations}
          onSelect={loadConversation}
          onNewChat={handleNewChat}
          onDelete={removeConversation}
        />
      }
      thread={
        <>
          <ChatThread
            messages={messages}
            loading={loadingMessages}
            busy={busy}
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={loadConversation}
            onNewChat={handleNewChat}
            onPrompt={handleAsk}
            onSelectCitation={handleSelectCitation}
            selectedCitationIndex={selectedCitationIndex}
          />
          <ChatComposer query={query} busy={busy} onChange={setQuery} onSubmit={handleAsk} />
        </>
      }
      inspector={
        <CitationInspector
          open={Boolean(selectedCitation)}
          loading={sourceLoading}
          citation={selectedCitation}
          detail={sourceDetail}
          onClose={() => {
            setSelectedCitation(null);
            setSelectedCitationIndex(null);
            setSourceDetail(null);
          }}
        />
      }
    />
  );
}
