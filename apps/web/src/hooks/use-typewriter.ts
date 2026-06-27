"use client";

import { useEffect, useState } from "react";

export function useTypewriter(text: string, enabled: boolean, speedMs = 24) {
  const [display, setDisplay] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled) {
      setDisplay(text);
      return;
    }
    setDisplay("");
    let index = 0;
    const maxChars = Math.min(text.length, 2400);
    const interval = window.setInterval(() => {
      index += 1;
      setDisplay(text.slice(0, index));
      if (index >= maxChars) {
        setDisplay(text);
        window.clearInterval(interval);
      }
    }, speedMs);
    return () => window.clearInterval(interval);
  }, [enabled, speedMs, text]);

  return display;
}
