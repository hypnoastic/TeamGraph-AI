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
    () => (mode === 'login' ? 'Sign in to TeamGraph' : 'Create your account'),
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
    <div className="min-h-screen bg-[#050506] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            TeamGraph
          </Link>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
            Live Brain operations
          </p>
        </div>

        <div className="bg-[#0A0A0B] border border-[var(--color-border-subtle)] rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-[var(--color-text-primary)]">{title}</h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input-field w-full text-sm"
                  placeholder="Alicia Engineer"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field w-full text-sm"
                placeholder="you@teamgraph.ai"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-field w-full text-sm"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-[var(--color-accent-unsafe)]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-2.5 bg-[var(--color-accent-brain)] text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 text-sm"
            >
              {isSubmitting ? 'Working…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-xs">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[var(--color-accent-brain)] hover:underline"
            >
              {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <div className="border-t border-[var(--color-border-subtle)] pt-4 space-y-3">
            <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] text-center font-mono">
              Quick access demo credentials
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => loginAs('admin')}
                className="px-3 py-1.5 rounded bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => loginAs('member')}
                className="px-3 py-1.5 rounded bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] transition-colors"
              >
                Member
              </button>
              <button
                type="button"
                onClick={() => loginAs('demo')}
                className="px-3 py-1.5 rounded bg-[var(--color-card-base)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-card-hover)] transition-colors"
              >
                Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

