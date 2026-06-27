"use client";

import type { ReactNode } from "react";

type BrainChatLayoutProps = {
  sidebar: ReactNode;
  thread: ReactNode;
  inspector?: ReactNode;
};

export function BrainChatLayout({ sidebar, thread, inspector }: BrainChatLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-130px)] gap-0 overflow-hidden border-2 border-black bg-[var(--surface)] shadow-[6px_6px_0_black]">
      <aside className="hidden w-[260px] shrink-0 border-r-2 border-black bg-[#f7f2ea] md:flex md:flex-col">
        {sidebar}
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">{thread}</section>
      {inspector ? (
        <aside className="hidden w-[320px] shrink-0 border-l-2 border-black bg-white xl:flex xl:flex-col">
          {inspector}
        </aside>
      ) : null}
    </div>
  );
}
