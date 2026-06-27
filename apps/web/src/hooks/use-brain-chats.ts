"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type { BrainConversationDetail, BrainConversationSummary, BrainResponse } from "@/lib/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  answer?: BrainResponse;
  error?: boolean;
  status?: "thinking" | "ready";
  animate?: boolean;
};

export function useBrainChats() {
  const [conversations, setConversations] = useState<BrainConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const data = await apiGet<BrainConversationSummary[]>("/brain/conversations");
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    setActiveConversationId(conversationId);
    try {
      const detail = await apiGet<BrainConversationDetail>(`/brain/conversations/${conversationId}`);
      setMessages(
        detail.messages.map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          text: message.text,
          answer: message.answer || undefined,
          status: "ready",
        })),
      );
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startConversation = useCallback(async () => {
    const created = await apiPost<BrainConversationSummary>("/brain/conversations");
    setConversations((current) => [created, ...current]);
    setActiveConversationId(created.id);
    setMessages([]);
    return created.id;
  }, []);

  const removeConversation = useCallback(
    async (conversationId: string) => {
      await apiDelete(`/brain/conversations/${conversationId}`);
      setConversations((current) => current.filter((item) => item.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
    },
    [activeConversationId],
  );

  const ask = useCallback(
    async (query: string) => {
      const text = query.trim();
      if (!text || busy) return;

      let conversationId = activeConversationId;
      if (!conversationId) {
        conversationId = await startConversation();
      }

      const userMessage: ChatMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        text,
        status: "ready",
      };
      const thinkingId = `local-thinking-${Date.now()}`;
      setMessages((current) => [
        ...current,
        userMessage,
        { id: thinkingId, role: "assistant", text: "", status: "thinking" },
      ]);
      setBusy(true);

      try {
        const answer = await apiPost<BrainResponse>("/brain/query", {
          query: text,
          conversation_id: conversationId,
        });
        setMessages((current) =>
          current
            .filter((message) => message.id !== thinkingId)
            .concat({
              id: `local-assistant-${Date.now()}`,
              role: "assistant",
              text: answer.answer,
              answer,
              status: "ready",
              animate: true,
            }),
        );
        await refreshConversations();
      } catch {
        setMessages((current) =>
          current
            .filter((message) => message.id !== thinkingId)
            .concat({
              id: `local-assistant-${Date.now()}`,
              role: "assistant",
              text: "The brain is unavailable right now. Try again in a moment.",
              error: true,
              status: "ready",
            }),
        );
      } finally {
        setBusy(false);
      }
    },
    [activeConversationId, busy, refreshConversations, startConversation],
  );

  return {
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
    refreshConversations,
  };
}
