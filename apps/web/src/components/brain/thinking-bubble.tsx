"use client";

export function ThinkingBubble() {
  return (
    <article className="max-w-[90%] border-l-4 border-[var(--purple)] pl-4">
      <div className="mono mb-2 text-[10px] font-bold uppercase">TeamGraph · thinking</div>
      <div className="flex items-center gap-2 text-sm font-bold">
        <span>TeamGraph is thinking</span>
        <span className="inline-flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:120ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-black [animation-delay:240ms]" />
        </span>
      </div>
    </article>
  );
}
