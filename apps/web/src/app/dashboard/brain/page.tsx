"use client";

import { useCallback, useState } from "react";
import { BrainChatLayout } from "@/components/brain/brain-chat-layout";
import { ChatComposer } from "@/components/brain/chat-composer";
import { ChatHistorySidebar } from "@/components/brain/chat-history-sidebar";
import { ChatThread } from "@/components/brain/chat-thread";
import { CitationInspector } from "@/components/brain/citation-inspector";
import { citationRef, hasCitationRef } from "@/components/brain/citation-chip";
import { NewChatModal } from "@/components/brain/new-chat-modal";
import { useBrainChats } from "@/hooks/use-brain-chats";
import { apiGet } from "@/lib/api";
import type { BrainCitation, BrainSourceDetail } from "@/lib/types";

export default function BrainPage() {
  const [query, setQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<BrainCitation | null>(null);
  const [selectedCitationIndex, setSelectedCitationIndex] = useState<number | null>(null);
  const [sourceDetail, setSourceDetail] = useState<BrainSourceDetail | null>(null);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [sourceError, setSourceError] = useState(false);

  const {
    conversations,
    activeConversationId,
    messages,
    loadingConversations,
    loadingMessages,
    busy,
    creatingChat,
    ask,
    loadConversation,
    startConversation,
    removeConversation,
    prepareNewChat,
  } = useBrainChats();

  const handleSelectCitation = useCallback(async (citation: BrainCitation, index: number) => {
    setSelectedCitation(citation);
    setSelectedCitationIndex(index);
    setSourceDetail(null);
    setSourceError(false);

    if (!hasCitationRef(citation)) {
      setSourceLoading(false);
      return;
    }

    setSourceLoading(true);
    try {
      const ref = citationRef(citation);
      const detail = await apiGet<BrainSourceDetail>(`/brain/sources/${encodeURIComponent(ref)}`);
      setSourceDetail(detail);
    } catch {
      setSourceError(true);
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

  const handleOpenNewChat = () => {
    setSelectedCitation(null);
    setSelectedCitationIndex(null);
    setSourceDetail(null);
    setSourceError(false);
    prepareNewChat();
    setNewChatOpen(true);
  };

  const handleCreateChat = async (title: string) => {
    await startConversation(title);
  };

  return (
    <>
      <BrainChatLayout
        sidebar={
          <ChatHistorySidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            loading={loadingConversations}
            onSelect={loadConversation}
            onOpenNewChat={handleOpenNewChat}
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
              onOpenNewChat={handleOpenNewChat}
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
            fetchFailed={sourceError}
            onClose={() => {
              setSelectedCitation(null);
              setSelectedCitationIndex(null);
              setSourceDetail(null);
              setSourceError(false);
            }}
          />
        }
      />
      <NewChatModal
        open={newChatOpen}
        busy={creatingChat}
        onClose={() => setNewChatOpen(false)}
        onCreate={handleCreateChat}
      />
    </>
  );
}
