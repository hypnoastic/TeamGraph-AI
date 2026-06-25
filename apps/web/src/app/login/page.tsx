"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { SessionUser } from "@/lib/types";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import type { SessionUser } from "@/lib/types";

type AuthMode = "login" | "signup";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) return response.data.detail;
  }
  return error instanceof Error ? error.message : "Authentication failed";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const authenticate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await apiPost<{ token: string; user: SessionUser }>(
        mode === "login" ? "/auth/login" : "/auth/signup",
        mode === "login" ? { email, password } : { name, email, password },
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

  const demo = (kind: "admin" | "member" | "demo") => {
    setMode("login");
    setEmail(`${kind}@teamgraph.local`);
    setPassword("password");
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setBusy(true);
    setError("");
    try {
      const data = await apiPost<{ token: string; user: SessionUser }>(
        "/auth/google",
        { credential: credentialResponse.credential },
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
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          <form onSubmit={authenticate} className="panel w-full max-w-md p-6 md:p-8">
            <div className="mb-6 flex border-2 border-black">
              {(["login", "signup"] as const).map((item) => <button type="button" key={item} onClick={() => setMode(item)} className={`flex-1 px-4 py-2 font-black capitalize ${mode === item ? "bg-[var(--yellow)]" : "bg-white"}`}>{item}</button>)}
            </div>
            
            <div className="mb-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Google Sign-In failed.")}
                theme="filled_black"
                shape="rectangular"
                width="100%"
              />
            </div>
            
            <div className="relative mb-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/20"></div></div>
              <div className="relative inline-block bg-[var(--paper)] px-4 text-xs font-bold uppercase text-black/40">Or continue with email</div>
            </div>

            {mode === "signup" && <input className="input-field mb-3" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />}
            <input className="input-field mb-3" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
            <input className="input-field mb-4" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" minLength={mode === "signup" ? 8 : 4} required />
            {error && <div className="mb-4 border-2 border-black bg-[var(--coral)] p-3 text-sm font-bold">{error}</div>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Working..." : mode === "login" ? "Sign in" : "Create account"}</button>
            <div className="mono my-5 text-center text-[10px] font-bold uppercase">Demo access</div>
            <div className="grid grid-cols-3 gap-2">{(["admin", "member", "demo"] as const).map((item) => <button type="button" className="btn-secondary min-h-9 px-2 text-xs capitalize" key={item} onClick={() => demo(item)}>{item}</button>)}</div>
          </form>
        </GoogleOAuthProvider>
      </section>
    </main>
  );
}
