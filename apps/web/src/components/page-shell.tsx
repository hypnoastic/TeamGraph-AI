import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, actions, children }: PageShellProps) {
  return (
    <section className="page-enter mx-auto w-full max-w-[1500px]">
      {(title || actions) && (
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            {eyebrow && <div className="mono mb-1 text-[11px] font-bold uppercase tracking-[.12em]">{eyebrow}</div>}
            {title && <h1 className="text-2xl font-black tracking-[-.04em] md:text-3xl">{title}</h1>}
            {description && <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
