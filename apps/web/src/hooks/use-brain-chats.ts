"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

function toChatMessages(detail: BrainConversationDetail): ChatMessage[] {
  return detail.messages.map((message) => ({
    id: message.id,
    role: message.role as "user" | "assistant",
    text: message.text,
    answer: message.answer || undefined,
    status: "ready",
  }));
}

export function useBrainChats() {
  const [conversations, setConversations] = useState<BrainConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [busy, setBusy] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const threadCache = useRef<Map<string, ChatMessage[]>>(new Map());

  const refreshConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const data = await apiGet<BrainConversationSummary[]>("/brain/conversations");
      setConversations(data);
    } catch {
      if (!silent) setConversations([]);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const cached = threadCache.current.get(conversationId);
    if (cached) {
      setMessages(cached);
      setLoadingMessages(false);
    } else {
      setLoadingMessages(true);
    }

    try {
      const detail = await apiGet<BrainConversationDetail>(`/brain/conversations/${conversationId}`);
      const nextMessages = toChatMessages(detail);
      threadCache.current.set(conversationId, nextMessages);
      setMessages(nextMessages);
    } catch {
      if (!cached) setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const startConversation = useCallback(async (title: string) => {
    setCreatingChat(true);
    try {
      const created = await apiPost<BrainConversationSummary>("/brain/conversations", { title: title.trim() });
      setConversations((current) => [created, ...current]);
      setActiveConversationId(created.id);
      setMessages([]);
      threadCache.current.set(created.id, []);
      return created.id;
    } finally {
      setCreatingChat(false);
    }
  }, []);

  const removeConversation = useCallback(
    async (conversationId: string) => {
      await apiDelete(`/brain/conversations/${conversationId}`);
      threadCache.current.delete(conversationId);
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
        conversationId = await startConversation(text.slice(0, 80));
      }

      const userMessage: ChatMessage = {
        id: `local-user-${Date.now()}`,
        role: "user",
        text,
        status: "ready",
      };
      const thinkingId = `local-thinking-${Date.now()}`;
      setMessages((current) => {
        const next = [
          ...current,
          userMessage,
          { id: thinkingId, role: "assistant" as const, text: "", status: "thinking" as const },
        ];
        if (conversationId) threadCache.current.set(conversationId, next.filter((m) => m.id !== thinkingId));
        return next;
      });
      setBusy(true);

      try {
        const answer = await apiPost<BrainResponse>("/brain/query", {
          query: text,
          conversation_id: conversationId,
        });
        setMessages((current) => {
          const next = current
            .filter((message) => message.id !== thinkingId)
            .concat({
              id: `local-assistant-${Date.now()}`,
              role: "assistant",
              text: answer.answer,
              answer,
              status: "ready",
              animate: true,
            });
          if (conversationId) threadCache.current.set(conversationId, next);
          return next;
        });
        await refreshConversations(true);
      } catch {
        setMessages((current) => {
          const next = current
            .filter((message) => message.id !== thinkingId)
            .concat({
              id: `local-assistant-${Date.now()}`,
              role: "assistant",
              text: "The brain is unavailable right now. Try again in a moment.",
              error: true,
              status: "ready",
            });
          if (conversationId) threadCache.current.set(conversationId, next);
          return next;
        });
      } finally {
        setBusy(false);
      }
    },
    [activeConversationId, busy, refreshConversations, startConversation],
  );

  const prepareNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setLoadingMessages(false);
  }, []);

  return {
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
    refreshConversations,
    prepareNewChat,
  };
}
