"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiGet } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  useEffect(() => { apiGet<SessionUser>("/auth/me").then(setUser).catch(() => setUser(null)); }, []);

  if (!user) return <PageShell title="Settings">Loading...</PageShell>;

  return (
    <PageShell title="Settings" description="Manage your account profile.">
      <section className="panel p-6">
        <h2 className="mb-4 text-xl font-bold">Profile Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase text-[var(--muted)]">Name</div>
            <div className="text-lg font-black">{user.name}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[var(--muted)]">Email</div>
            <div className="text-lg font-black">{user.email}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase text-[var(--muted)]">Role</div>
            <div className="text-lg font-black capitalize">{user.role}</div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
