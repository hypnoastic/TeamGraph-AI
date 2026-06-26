"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return error instanceof Error ? error.message : "Authentication failed";
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loginAs = async (kind: "admin" | "member") => {
    setBusy(true);
    setError("");
    try {
      const data = await apiPost<{ token: string; user: SessionUser }>(
        "/auth/login",
        { email: `${kind}@teamgraph.local`, password: "password" },
        false
      );
      localStorage.setItem("teamgraph_token", data.token);
      localStorage.setItem("teamgraph_user", JSON.stringify(data.user));
      const invite = new URLSearchParams(window.location.search).get("invite");
      if (invite) {
        await apiPost("/team/invitations/accept", { token: invite });
        const user = await apiGet<SessionUser>("/auth/me");
        localStorage.setItem("teamgraph_user", JSON.stringify(user));
        router.replace("/dashboard");
      } else {
        router.replace(data.user.onboarding_required ? "/onboarding" : "/dashboard");
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-[.8fr_1.2fr]">
      <section className="flex flex-col justify-between bg-black p-7 text-white md:p-12">
        <Link href="/" className="text-xl font-black tracking-[-.05em]">TEAMGRAPH<span className="text-[var(--lime)]">.</span></Link>
        <h1 className="my-16 max-w-md text-5xl font-black leading-[.94] tracking-[-.07em]">Memory your agents can trust.</h1>
        <span className="mono text-xs text-white/60">GRAPHITI / NEO4J / TEAMGRAPH</span>
      </section>
      <section className="grid place-items-center bg-[var(--paper)] p-5">
        <div className="panel w-full max-w-sm p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black mb-2">Welcome</h2>
            <p className="text-sm">Select a demo account to test the platform.</p>
          </div>
          
          {error && <div className="mb-4 border-2 border-black bg-[var(--coral)] p-3 text-sm font-bold">{error}</div>}
          
          <div className="flex flex-col gap-4">
            <button 
              type="button" 
              className="btn-primary py-3 w-full" 
              disabled={busy}
              onClick={() => loginAs("admin")}
            >
              {busy ? "Working..." : "Log in as Admin"}
            </button>
            <button 
              type="button" 
              className="btn-secondary py-3 w-full" 
              disabled={busy}
              onClick={() => loginAs("member")}
            >
              {busy ? "Working..." : "Log in as Member"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
