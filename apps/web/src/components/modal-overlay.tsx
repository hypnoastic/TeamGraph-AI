"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ModalOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function ModalOverlay({ open, onClose, children }: ModalOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[80vh] flex flex-col">{children}</div>
    </div>,
    document.body,
  );
}
