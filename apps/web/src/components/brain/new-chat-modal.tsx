"use client";

import { useState } from "react";
import { ModalOverlay } from "@/components/modal-overlay";
import { LoadingButton } from "@/components/loading-button";

type NewChatModalProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
};

export function NewChatModal({ open, busy, onClose, onCreate }: NewChatModalProps) {
  const [title, setTitle] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onCreate(trimmed);
    setTitle("");
    onClose();
  };

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <form onSubmit={submit} className="panel flex flex-col p-5">
        <h2 className="text-xl font-black">New chat</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Name this thread so you can find it later.</p>
        <input
          autoFocus
          className="input-field mt-4"
          placeholder="e.g. Q3 launch planning"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={255}
          required
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <LoadingButton
            type="submit"
            busy={busy}
            busyLabel="Working..."
            label="Create chat"
            className="btn-primary"
            disabled={!title.trim()}
          />
        </div>
      </form>
    </ModalOverlay>
  );
}
