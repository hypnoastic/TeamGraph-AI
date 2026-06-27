"use client";

import { useCallback, useMemo, useRef } from "react";
import type { Node, Viewport } from "@xyflow/react";

type SavedLayout = {
  positions: Record<string, { x: number; y: number }>;
  viewport?: Viewport;
};

function layoutKey(userId: string) {
  return `teamgraph:graph-layout:${userId}`;
}

function readLayout(userId: string | null): SavedLayout | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(layoutKey(userId));
    return raw ? (JSON.parse(raw) as SavedLayout) : null;
  } catch {
    return null;
  }
}

function writeLayout(userId: string | null, layout: SavedLayout) {
  if (!userId || typeof window === "undefined") return;
  localStorage.setItem(layoutKey(userId), JSON.stringify(layout));
}

export function useGraphLayout(userId: string | null) {
  const savedRef = useRef(readLayout(userId));
  const saveTimer = useRef<number | null>(null);

  const hasSavedLayout = useMemo(() => {
    const saved = savedRef.current;
    return Boolean(saved && Object.keys(saved.positions).length > 0);
  }, [userId]);

  const applySavedPositions = useCallback((nodes: Node[]): Node[] => {
    const saved = savedRef.current?.positions;
    if (!saved) return nodes;
    return nodes.map((node) => {
      const position = saved[node.id];
      return position ? { ...node, position } : node;
    });
  }, []);

  const savedViewport = savedRef.current?.viewport;

  const persistPositions = useCallback(
    (nodes: Node[]) => {
      if (!userId) return;
      const positions = Object.fromEntries(nodes.map((node) => [node.id, node.position]));
      const current = savedRef.current || { positions: {} };
      savedRef.current = { ...current, positions };
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        writeLayout(userId, savedRef.current || { positions });
      }, 300);
    },
    [userId],
  );

  const persistViewport = useCallback(
    (viewport: Viewport) => {
      if (!userId) return;
      const current = savedRef.current || { positions: {} };
      savedRef.current = { ...current, viewport };
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        writeLayout(userId, savedRef.current || { positions: {}, viewport });
      }, 300);
    },
    [userId],
  );

  return {
    hasSavedLayout,
    savedViewport,
    applySavedPositions,
    persistPositions,
    persistViewport,
  };
}
