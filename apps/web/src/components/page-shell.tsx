"use client";

import type { ReactNode } from 'react';

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, actions, children }: PageShellProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      <section className="rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-card-base)]/75 backdrop-blur-sm p-6 md:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            {eyebrow && (
              <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--color-accent-brain)]">
                {eyebrow}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                {title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm md:text-base text-[var(--color-text-secondary)]">
                {description}
              </p>
            </div>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </section>

      <section className="space-y-6">{children}</section>
    </div>
  );
}
