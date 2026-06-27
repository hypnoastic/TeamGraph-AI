"use client";

import type { ReactNode } from "react";

type BrainChatLayoutProps = {
  sidebar: ReactNode;
  thread: ReactNode;
  inspector?: ReactNode;
};

export function BrainChatLayout({ sidebar, thread, inspector }: BrainChatLayoutProps) {
  return (
    <div className="flex h-full min-h-0 gap-0 overflow-hidden border-2 border-black bg-[var(--surface)] shadow-[6px_6px_0_black]">
      <aside className="hidden min-h-0 w-[260px] shrink-0 flex-col overflow-hidden border-r-2 border-black bg-[#f7f2ea] md:flex">
        {sidebar}
      </aside>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{thread}</section>
      {inspector ? (
        <aside className="hidden min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l-2 border-black bg-white xl:flex">
          {inspector}
        </aside>
      ) : null}
    </div>
  );
}
