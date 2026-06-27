"use client";

import { Plug, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { ModalOverlay } from "@/components/modal-overlay";
import { apiGet, apiPost, getCachedData, setCachedData } from "@/lib/api";
import type { ConnectorRecord } from "@/lib/types";

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>(() => {
    if (typeof window !== "undefined") {
      return getCachedData<ConnectorRecord[]>("/integrations") || [];
    }
    return [];
  });
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !getCachedData("/integrations");
    }
    return true;
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Configuration Modal State
  const [configModalProvider, setConfigModalProvider] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [repos, setRepos] = useState<{ id: number; full_name: string }[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  const refresh = (force = false) => {
    const cached = getCachedData<ConnectorRecord[]>("/integrations");
    if (cached && !force) {
      setConnectors(cached);
      setLoadingPage(false);
      return;
    }

    setLoadingPage(true);
    apiGet<{ connectors: ConnectorRecord[] }>("/integrations")
      .then((data) => {
        setCachedData("/integrations", data.connectors);
        setConnectors(data.connectors);
      })
      .catch(() => setConnectors([]))
      .finally(() => setLoadingPage(false));
  };

  useEffect(() => {
    refresh();
    const rawUser = localStorage.getItem("teamgraph_user");
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        setIsAdmin(parsed.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    }
  }, []);

  const handleConnect = async (provider: string) => {
    setLoading(provider);
    try {
      const data = await apiGet<{ url: string }>(`/integrations/${provider}/connect`);
      window.location.href = data.url;
    } catch (e) {
      alert("Failed to connect: " + (e instanceof Error ? e.message : String(e)));
      setLoading(null);
    }
  };

  const handleDisconnect = async (provider: string) => {
    setLoading(provider);
    try {
      await apiPost(`/integrations/${provider}/disconnect`);
      refresh(true);
    } catch (e) {
      alert("Failed to disconnect: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(null);
    }
  };

  const handleConfigure = async (provider: string) => {
    setConfigModalProvider(provider);
    setConfigLoading(true);
    try {
      if (provider === "github") {
        const data = await apiGet<{ repositories: { id: number; full_name: string }[]; selected: string[] }>(
          `/integrations/github/repositories`
        );
        setRepos(data.repositories);
        setSelectedRepos(data.selected);
      }
    } catch (e) {
      alert("Failed to fetch configuration: " + (e instanceof Error ? e.message : String(e)));
      setConfigModalProvider(null);
    } finally {
      setConfigLoading(false);
    }
  };

  const saveConfiguration = async () => {
    setConfigLoading(true);
    try {
      if (configModalProvider === "github") {
        await apiPost(`/integrations/github/repositories/select`, {
          repositories: selectedRepos,
        });
      }
      setConfigModalProvider(null);
    } catch (e) {
      alert("Failed to save configuration: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setConfigLoading(false);
    }
  };

  const toggleRepo = (repoName: string) => {
    setSelectedRepos((prev) =>
      prev.includes(repoName) ? prev.filter((name) => name !== repoName) : [...prev, repoName]
    );
  };

  return (
    <PageShell title="Connectors" description="Enable sync adapters to import workplace data dynamically.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loadingPage && connectors.length === 0 ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="panel p-5 flex flex-col justify-between min-h-[250px] bg-white/5 animate-pulse border-2 border-black/10"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="h-6 w-6 bg-black/10 rounded" />
                  <div className="h-5 w-16 bg-black/10 rounded-full" />
                </div>
                <div className="mt-6 h-6 w-32 bg-black/10 rounded" />
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-black/10 rounded w-full" />
                  <div className="h-4 bg-black/10 rounded w-5/6" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="h-4 bg-black/10 rounded w-2/3" />
                <div className="h-8 bg-black/10 rounded w-full" />
              </div>
            </div>
          ))
        ) : (
          connectors.map((connector, index) => {
            const isConnected = connector.state === "connected";
            const isConfigured = connector.state === "configured";

            let statusBadge = <span className="badge">Soon</span>;
            if (isConnected) {
              statusBadge = (
                <span className="badge badge-safe flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              );
            } else if (isConfigured) {
              statusBadge = <span className="badge badge-review">Ready</span>;
            }

            return (
              <article
                key={connector.key}
                className={`panel p-5 flex flex-col justify-between min-h-[250px] ${
                  ["bg-[var(--yellow)]", "bg-[var(--cyan)]", "bg-[var(--lime)]", "bg-[var(--coral)]"][index % 4]
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <Plug size={24} />
                    {statusBadge}
                  </div>
                  <h2 className="mt-6 text-xl font-black">{connector.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed">{connector.description}</p>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="text-xs font-mono font-black uppercase tracking-wider opacity-70">
                    {connector.todo}
                  </div>

                  {isConnected ? (
                    <div className="flex flex-col gap-2">
                      {connector.key === "github" && (
                        <button
                          disabled={loading !== null || !isAdmin}
                          onClick={() => handleConfigure(connector.key)}
                          className="btn-primary w-full text-xs font-black py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Configure Sync
                        </button>
                      )}
                      <button
                        disabled={loading !== null || !isAdmin}
                        onClick={() => handleDisconnect(connector.key)}
                        className="btn-secondary w-full text-xs font-black py-1.5 shadow-[2px_2px_0_black] disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isAdmin ? "Only administrators can disconnect connectors." : ""}
                      >
                        {!isAdmin ? "Admin Only" : loading === connector.key ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  ) : isConfigured ? (
                    <button
                      disabled={loading !== null || !isAdmin}
                      onClick={() => handleConnect(connector.key)}
                      className="btn-primary w-full text-xs font-black py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={!isAdmin ? "Only administrators can connect connectors." : ""}
                    >
                      {!isAdmin ? "Admin Only" : loading === connector.key ? "Connecting..." : "Connect"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn-secondary w-full text-xs font-black py-1.5 opacity-55 cursor-not-allowed transform-none shadow-none"
                      title="Define credentials in .env to connect."
                    >
                      Keys Required
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

      <ModalOverlay open={Boolean(configModalProvider)} onClose={() => setConfigModalProvider(null)}>
          <div className="bg-[var(--paper)] border-2 border-black p-6 shadow-[8px_8px_0_black] w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black capitalize">{configModalProvider} Configuration</h3>
              <button
                onClick={() => setConfigModalProvider(null)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>
            </div>

            {configLoading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : configModalProvider === "github" ? (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <p className="text-sm text-black/70">
                  Select the repositories you want TeamGraph AI to index and synchronize. 
                  Only repositories you have granted the GitHub App access to are listed below.
                </p>
                <div className="space-y-2">
                  {repos.length === 0 ? (
                    <div className="p-4 border border-black/10 bg-black/5 text-center text-sm">
                      No repositories found. Ensure your GitHub App installation includes access to repositories.
                    </div>
                  ) : (
                    repos.map((repo) => (
                      <label
                        key={repo.id}
                        className="flex items-center gap-3 p-3 border border-black/10 hover:bg-black/5 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-black/20 bg-transparent text-[var(--accent)] focus:ring-[var(--accent)]"
                          checked={selectedRepos.includes(repo.full_name)}
                          onChange={() => toggleRepo(repo.full_name)}
                        />
                        <span className="font-mono text-sm">{repo.full_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-black/10 flex justify-end gap-3">
              <button
                onClick={() => setConfigModalProvider(null)}
                className="btn-secondary px-4 py-2 text-sm shadow-none transform-none"
              >
                Cancel
              </button>
              <button
                onClick={saveConfiguration}
                disabled={configLoading}
                className="btn-primary px-4 py-2 text-sm"
              >
                Save Configuration
              </button>
            </div>
          </div>
      </ModalOverlay>
    </PageShell>
  );
}
