"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { LoadingButton } from "@/components/loading-button";
import type { SessionUser } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState("");
  const [project, setProject] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await apiPost("/onboarding/organization", { organization_name: organization, project_name: project });
      const user = await apiGet<SessionUser>("/auth/me");
      localStorage.setItem("teamgraph_user", JSON.stringify(user));
      router.replace("/dashboard");
    } catch (caught: unknown) {
      const message = caught && typeof caught === "object" && "message" in caught ? String(caught.message) : "Setup failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--paper)] p-5">
      <form onSubmit={submit} className="panel w-full max-w-lg p-7">
        <div className="mono mb-2 text-xs font-bold uppercase">First setup</div>
        <h1 className="mb-6 text-4xl font-black tracking-[-.06em]">Name your brain.</h1>
        <label className="mono mb-1 block text-xs font-bold uppercase">Organization</label>
        <input className="input-field mb-4" value={organization} onChange={(e) => setOrganization(e.target.value)} required minLength={2} />
        <label className="mono mb-1 block text-xs font-bold uppercase">First project</label>
        <input className="input-field mb-5" value={project} onChange={(e) => setProject(e.target.value)} required minLength={2} />
        {error && <div className="mb-4 border-2 border-black bg-[var(--coral)] p-3 text-sm font-bold">{error}</div>}
        <LoadingButton type="submit" busy={busy} busyLabel="Working..." label="Create workspace" className="btn-primary w-full" />
      </form>
    </main>
  );
}
