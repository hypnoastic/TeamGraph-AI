"use client";

import { useState } from 'react';
import { Bot, Database, Network, Send, User } from 'lucide-react';

import { apiPost } from '@/lib/api';
import type { BrainResponse } from '@/lib/types';

type ChatMessage =
  | { role: 'user'; content: string }
  | ({ role: 'assistant'; content: string; error?: false } & BrainResponse)
  | { role: 'assistant'; content: string; error: true };

export default function BrainChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const data = await apiPost<BrainResponse>('/brain/query', {
        query: userMessage.content,
        project: 'Core Platform',
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          ...data,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to connect to the TeamGraph brain. Check the backend and Neo4j services.',
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Brain Chat</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Query the organization&apos;s Graphiti-powered live context brain.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-4">
            <Database size={48} className="opacity-20" />
            <p>Ask about projects, decisions, handoffs, or recent team memory.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setQuery('What context was recently added for Core Platform?')}
                className="card px-4 py-2 text-xs hover:text-[var(--color-accent-brain)]"
              >
                Recent Core Platform context
              </button>
              <button
                onClick={() => setQuery('What should the next engineer know before continuing work?')}
                className="card px-4 py-2 text-xs hover:text-[var(--color-accent-brain)]"
              >
                Handoff context
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex space-x-4 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-[var(--color-card-base)]'
                    : 'bg-[var(--color-accent-brain)] text-[#07080A]'
                }`}
              >
                {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl ${
                    message.role === 'user' ? 'bg-[var(--color-card-base)] border border-[var(--color-border-subtle)]' : ''
                  }`}
                >
                  {'mode' in message && !message.error && (
                    <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                      <span>{message.mode}</span>
                      <span>·</span>
                      <span>{message.provider}</span>
                      <span>·</span>
                      <span>{Math.round(message.confidence * 100)}% confidence</span>
                    </div>
                  )}
                  <p
                    className={`whitespace-pre-wrap ${
                      'error' in message && message.error
                        ? 'text-[var(--color-accent-unsafe)]'
                        : 'text-[var(--color-text-primary)]'
                    }`}
                  >
                    {message.content}
                  </p>
                </div>

                {message.role === 'assistant' && !message.error && (
                  <div className="flex flex-wrap gap-4 text-xs">
                    {message.citations.length > 0 && (
                      <div className="space-y-2 w-full">
                        <span className="text-[var(--color-text-muted)] flex items-center uppercase tracking-wider text-[10px]">
                          <Database size={12} className="mr-1" /> Sources
                        </span>
                        <div className="grid gap-2">
                          {message.citations.map((citation, citationIndex) => (
                            <div
                              key={citationIndex}
                              className="card px-3 py-2 text-[var(--color-text-secondary)] border-l-2 border-l-[var(--color-accent-brain)]"
                            >
                              <div className="text-[var(--color-text-primary)] font-medium">{citation.title}</div>
                              {citation.summary && <div className="mt-1">{citation.summary}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.related_facts.length > 0 && (
                      <div className="space-y-2 w-full">
                        <span className="text-[var(--color-text-muted)] flex items-center uppercase tracking-wider text-[10px]">
                          <Network size={12} className="mr-1" /> Related facts
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {message.related_facts.map((fact) => (
                            <span key={fact.id} className="card px-2 py-1 text-[var(--color-text-secondary)]">
                              {fact.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.suggested_next_actions.length > 0 && (
                      <div className="space-y-2 w-full">
                        <span className="text-[var(--color-text-muted)] uppercase tracking-wider text-[10px]">
                          Suggested next actions
                        </span>
                        <div className="grid gap-2">
                          {message.suggested_next_actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="text-[var(--color-text-secondary)]">
                              {action}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] flex space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-brain)] text-[#07080A] flex items-center justify-center">
                <Bot size={16} className="animate-pulse" />
              </div>
              <div className="p-4 flex space-x-1 items-center">
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[var(--color-border-subtle)] mt-auto">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ask the Brain..."
            className="w-full bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-xl pl-4 pr-12 py-4 outline-none focus:border-[var(--color-accent-brain)] transition-colors"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-text-primary)] text-[var(--color-background-base)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
