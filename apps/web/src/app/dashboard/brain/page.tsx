"use client";

import { useEffect, useRef, useState } from 'react';
import { Bot, Database, Network, Send, Sparkles, User } from 'lucide-react';

import { PageShell } from '@/components/page-shell';
import { apiPost } from '@/lib/api';
import type { BrainResponse } from '@/lib/types';

type ChatMessage =
  | { role: 'user'; content: string }
  | ({ role: 'assistant'; content: string; error?: false } & BrainResponse)
  | { role: 'assistant'; content: string; error: true };

const suggestions = [
  'What context was recently added for Core Platform?',
  'What should the next engineer know before continuing work?',
  'Are there any pending API key approvals?'
];

export default function BrainChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (event?: React.FormEvent, customQuery?: string) => {
    if (event) event.preventDefault();
    const activeQuery = customQuery || query;
    if (!activeQuery.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: activeQuery };
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

  const hasMessages = messages.length > 0;

  return (
    <PageShell>
      <div className={`flex flex-col ${hasMessages ? 'h-[calc(100vh-180px)]' : 'h-[calc(100vh-220px)] justify-center'} relative w-full max-w-3xl mx-auto`}>
        
        {/* Empty State / Floating Landing */}
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center space-y-6 text-center animate-fade-in py-12">
            <div className="w-12 h-12 rounded-full bg-[var(--color-accent-brain)]/10 flex items-center justify-center border border-[var(--color-accent-brain)]/20 shadow-[0_0_20px_rgba(0,245,212,0.1)]">
              <Sparkles size={24} className="text-[var(--color-accent-brain)]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              How can I help you today?
            </h2>
            
            {/* Center Chat Box */}
            <form onSubmit={(e) => handleSubmit(e)} className="w-full relative max-w-xl mt-4">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask TeamGraph anything..."
                className="w-full bg-[#0A0A0B] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-2xl pl-5 pr-14 py-4 outline-none focus:border-[var(--color-accent-brain)]/50 focus:shadow-[0_0_15px_rgba(0,245,212,0.05)] transition-all text-sm"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-text-primary)] text-black rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity"
              >
                <Send size={16} />
              </button>
            </form>

            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg pt-4">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSubmit(undefined, suggestion)}
                  className="px-3.5 py-2 rounded-xl border border-[var(--color-border-subtle)] bg-[#0A0A0B]/50 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent-brain)]/30 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Log */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-24 scrollbar-thin">
            {messages.map((message, index) => (
              <div key={index} className="flex gap-4">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${
                  message.role === 'user'
                    ? 'bg-[var(--color-card-base)] border-[var(--color-border-subtle)]'
                    : 'bg-[var(--color-accent-brain)]/10 border-[var(--color-accent-brain)]/20 text-[var(--color-accent-brain)]'
                }`}>
                  {message.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div className="text-[10px] font-mono text-[var(--color-text-muted)] tracking-wider">
                    {message.role === 'user' ? 'YOU' : 'TEAMGRAPH'}
                    {'mode' in message && !message.error && ` · ${message.mode.toUpperCase()} · ${message.provider.toUpperCase()} · ${Math.round(message.confidence * 100)}% CONFIDENCE`}
                  </div>

                  <p className={`text-[var(--color-text-primary)] text-sm leading-relaxed whitespace-pre-wrap ${
                    'error' in message && message.error ? 'text-[var(--color-accent-unsafe)]' : ''
                  }`}>
                    {message.content}
                  </p>

                  {message.role === 'assistant' && !message.error && (
                    <div className="space-y-4 pt-2">
                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                            <Database size={10} /> Referenced Sources
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {message.citations.map((citation, cIndex) => (
                              <div key={cIndex} className="p-3 rounded-lg border border-[var(--color-border-subtle)] bg-[#0A0A0B]/40 text-xs">
                                <div className="font-medium text-[var(--color-text-primary)] mb-1 truncate">{citation.title}</div>
                                {citation.summary && <div className="text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">{citation.summary}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Facts */}
                      {message.related_facts && message.related_facts.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] font-mono flex items-center gap-1">
                            <Network size={10} /> Context Graph linkages
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {message.related_facts.map((fact) => (
                              <span key={fact.id} className="px-2 py-1 rounded bg-[#0A0A0B]/40 border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)]">
                                {fact.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-brain)]/10 border border-[var(--color-accent-brain)]/20 text-[var(--color-accent-brain)] flex items-center justify-center">
                  <Bot size={14} className="animate-pulse" />
                </div>
                <div className="flex items-center space-x-1 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Sticky bottom input (only when messages exist) */}
        {hasMessages && (
          <div className="absolute bottom-0 left-0 right-0 pt-4 pb-6 bg-gradient-to-t from-[#050506] via-[#050506] to-transparent">
            <form onSubmit={(e) => handleSubmit(e)} className="relative max-w-xl mx-auto">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Reply..."
                className="w-full bg-[#0A0A0B] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] rounded-2xl pl-5 pr-14 py-3.5 outline-none focus:border-[var(--color-accent-brain)]/50 transition-colors text-sm"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-[var(--color-text-primary)] text-black rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

      </div>
    </PageShell>
  );
}
