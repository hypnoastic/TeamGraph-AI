"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('acme.local');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, domain })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      // Store token
      localStorage.setItem('teamgraph_token', data.token);
      localStorage.setItem('teamgraph_user', JSON.stringify(data.user));
      
      router.push('/dashboard/brain');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loginAs = (type: 'admin' | 'member') => {
    setEmail(`${type}@teamgraph.local`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Login to TeamGraph</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Enter your organization details to continue.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Organization Domain</label>
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="input-field w-full"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-[var(--color-text-secondary)]">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full"
              placeholder="you@acme.local"
              required 
            />
          </div>
          
          {error && <div className="text-[var(--color-accent-unsafe)] text-sm p-2 bg-red-950/30 rounded border border-red-900/50">{error}</div>}
          
          <button type="submit" className="btn-primary w-full mt-4">
            Sign In
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-[var(--color-border-subtle)]">
          <p className="text-sm text-[var(--color-text-muted)] mb-4 text-center">Demo Shortcuts</p>
          <div className="flex space-x-4">
            <button type="button" onClick={() => loginAs('admin')} className="btn-secondary w-full text-sm">
              Admin Login
            </button>
            <button type="button" onClick={() => loginAs('member')} className="btn-secondary w-full text-sm">
              Member Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
