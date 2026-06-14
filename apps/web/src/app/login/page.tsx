"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { apiPost } from '@/lib/api';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (mode === 'login' ? 'Sign in to TeamGraph' : 'Create your TeamGraph account'),
    [mode]
  );

  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Authenticate with Postgres-backed TeamGraph access and continue into the live brain.'
        : 'Create a production-ready account while keeping the demo shortcuts available for your hackathon walkthrough.',
    [mode]
  );

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload =
        mode === 'login'
          ? { email, password }
          : { name: name || email.split('@')[0] || 'New Member', email, password };
      const data = await apiPost<{ token: string; user: Record<string, unknown> }>(
        mode === 'login' ? '/auth/login' : '/auth/signup',
        payload,
        false
      );

      localStorage.setItem('teamgraph_token', data.token);
      localStorage.setItem('teamgraph_user', JSON.stringify(data.user));
      router.push('/dashboard/brain');
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loginAs = (type: 'admin' | 'member' | 'demo') => {
    setMode('login');
    setEmail(`${type}@teamgraph.local`);
    setPassword('password');
    setName(type === 'demo' ? 'Demo Operator' : '');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(0,245,212,0.10),_transparent_35%),linear-gradient(180deg,_#050506_0%,_#090B0D_40%,_#050506_100%)] px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <nav className="flex items-center justify-between mb-10">
          <Link href="/" className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            TeamGraph
          </Link>
          <div className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[var(--color-accent-brain)]">
            Graphiti + Postgres
          </div>
        </nav>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
          <section className="rounded-[32px] border border-[var(--color-border-subtle)] bg-[rgba(10,11,13,0.82)] backdrop-blur-xl p-8 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-accent-brain)]">Launch your live brain</div>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Team memory with production auth and demo-ready workflows.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-[var(--color-text-secondary)] leading-7">
              Postgres now owns auth, API keys, connector state, and activity. Graphiti and Neo4j stay focused on memory retrieval, graph structure, and the organization brain itself.
            </p>

            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {[
                ['Demo account', 'Use demo@teamgraph.local / password for the hackathon walkthrough.'],
                ['Seeded knowledge', 'The demo user starts with launch, connector, and deployment memory already loaded.'],
                ['MCP ready', 'API keys and the npm MCP CLI stay inside the TeamGraph control layer.'],
              ].map(([heading, copy]) => (
                <div key={heading} className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/70 p-5">
                  <div className="text-sm font-medium">{heading}</div>
                  <div className="mt-2 text-sm text-[var(--color-text-secondary)] leading-6">{copy}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--color-border-subtle)] bg-[rgba(12,13,16,0.92)] backdrop-blur-xl p-8 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
            <div className="flex gap-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-background-surface)] p-1 mb-8">
              {(['login', 'signup'] as AuthMode[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${
                    mode === value
                      ? 'bg-[var(--color-accent-brain)] text-[#071012] font-medium'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {value === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-6">{description}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="input-field w-full"
                    placeholder="Alicia Engineer"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="input-field w-full"
                  placeholder="you@teamgraph.ai"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field w-full"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-[rgba(244,63,94,0.3)] bg-[rgba(127,29,29,0.25)] px-4 py-3 text-sm text-[var(--color-accent-unsafe)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full !rounded-2xl !py-3 bg-[var(--color-accent-brain)] text-[#051013] hover:opacity-95 disabled:opacity-60"
              >
                {isSubmitting ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
              <div className="text-sm text-[var(--color-text-muted)] mb-4">Demo shortcuts</div>
              <div className="grid md:grid-cols-3 gap-3">
                <button type="button" onClick={() => loginAs('admin')} className="btn-secondary !rounded-2xl text-sm">
                  Admin
                </button>
                <button type="button" onClick={() => loginAs('member')} className="btn-secondary !rounded-2xl text-sm">
                  Member
                </button>
                <button type="button" onClick={() => loginAs('demo')} className="btn-secondary !rounded-2xl text-sm">
                  Demo Brain
                </button>
              </div>
              <div className="mt-4 text-xs text-[var(--color-text-muted)]">
                All seeded demo accounts use <code>password</code>.
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
