"use client";

import type { ReactNode } from 'react';

type PageShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ actions, children }: PageShellProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {actions && (
        <div className="flex items-center justify-end pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">{actions}</div>
        </div>
      )}
      <div className="w-full">{children}</div>
    </div>
  );
}

