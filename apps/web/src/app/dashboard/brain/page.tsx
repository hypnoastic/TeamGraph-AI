"use client";

import { useState } from 'react';
import { Send, Bot, User, Database, ChevronRight, Activity, Clock } from 'lucide-react';
import axios from 'axios';

export default function BrainChatPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('teamgraph_token');
      const res = await axios.post('http://localhost:8000/brain/query', {
        query: userMessage.content,
        project: "Core Platform" // Demo default
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = res.data;
      const aiMessage = {
        role: 'assistant',
        content: data.answer,
        citations: data.citations,
        related_nodes: data.related_nodes,
        confidence: data.confidence,
        actions: data.suggested_next_actions
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to Brain. Is the backend running?', error: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Brain Chat</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Query the organization's live context brain.</p>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-6 pb-6 scrollbar-hide">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-4">
            <Database size={48} className="opacity-20" />
            <p>Ask anything about the organization context, projects, or decisions.</p>
            <div className="flex space-x-2">
              <button onClick={() => setQuery("Why did we choose Neo4j?")} className="card px-4 py-2 text-xs hover:text-[var(--color-accent-brain)]">Why did we choose Neo4j?</button>
              <button onClick={() => setQuery("What is the status of the MCP CLI?")} className="card px-4 py-2 text-xs hover:text-[var(--color-accent-brain)]">Status of MCP CLI?</button>
            </div>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex space-x-4 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-[var(--color-card-base)]' : 'bg-[var(--color-accent-brain)] text-[#07080A]'}`}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="space-y-3">
                <div className={`p-4 rounded-xl ${m.role === 'user' ? 'bg-[var(--color-card-base)] border border-[var(--color-border-subtle)]' : ''}`}>
                  <p className={`whitespace-pre-wrap ${m.error ? 'text-[var(--color-accent-unsafe)]' : 'text-[var(--color-text-primary)]'}`}>
                    {m.content}
                  </p>
                </div>
                
                {m.role === 'assistant' && !m.error && (
                  <div className="flex flex-wrap gap-4 text-xs">
                    {m.citations && m.citations.length > 0 && (
                      <div className="space-y-2 w-full md:w-auto">
                        <span className="text-[var(--color-text-muted)] flex items-center uppercase tracking-wider text-[10px]"><Database size={12} className="mr-1"/> Citations</span>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((c: any, ci: number) => (
                            <span key={ci} className="card px-2 py-1 flex items-center space-x-1 text-[var(--color-text-secondary)] border-l-2 border-l-[var(--color-accent-brain)]">
                              <span>{c.title}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {m.related_nodes && m.related_nodes.length > 0 && (
                      <div className="space-y-2 w-full md:w-auto">
                        <span className="text-[var(--color-text-muted)] flex items-center uppercase tracking-wider text-[10px]"><Network size={12} className="mr-1"/> Related</span>
                        <div className="flex flex-wrap gap-2">
                          {m.related_nodes.map((rn: string, rni: number) => (
                            <span key={rni} className="card px-2 py-1 text-[var(--color-text-secondary)]">{rn}</span>
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
            onChange={(e) => setQuery(e.target.value)}
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
