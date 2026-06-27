"use client";

import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Project, SessionUser } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("org");
  const [user, setUser] = useState<SessionUser | null>(null);

  const refresh = () => apiGet<Project[]>("/projects").then(setProjects).catch(() => setProjects([]));

  useEffect(() => {
    const raw = localStorage.getItem("teamgraph_user");
    if (raw) setUser(JSON.parse(raw) as SessionUser);
    refresh();
  }, []);

  const isAdmin = user?.role === "admin";

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    await apiPost<Project>("/projects", { name: name.trim(), visibility });
    setName("");
    await refresh();
  };

  const updateVisibility = async (project: Project, next: string) => {
    await apiPatch<Project>(`/projects/${project.id}`, { visibility: next });
    await refresh();
  };

  const remove = async (projectId: string) => {
    await apiDelete(`/projects/${projectId}`);
    await refresh();
  };

  return (
    <PageShell
      title="Projects"
      description="Organize context, connectors, and team access by project."
      actions={<span className="badge badge-live">{projects.length} active</span>}
    >
      <div className="grid gap-6 xl:grid-cols-[.65fr_1.35fr]">
        {isAdmin ? (
          <form onSubmit={create} className="panel h-fit p-5">
            <h2 className="mb-4 font-black">New project</h2>
            <input
              className="input-field mb-3"
              placeholder="e.g. Platform rewrite"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <select className="input-field mb-4" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              <option value="org">Organization-wide</option>
              <option value="private">Private (assigned members only)</option>
            </select>
            <button type="submit" className="btn-primary w-full">
              <Plus size={15} /> Create project
            </button>
          </form>
        ) : (
          <section className="panel h-fit p-5 text-sm text-[var(--muted)]">
            Only admins can create projects. You can view projects assigned to you below.
          </section>
        )}

        <section className="panel overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Visibility</th>
                {isAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <FolderKanban size={15} />
                      <b>{project.name}</b>
                    </div>
                    <div className="mono text-[10px] text-[var(--muted)]">{project.id}</div>
                  </td>
                  <td>
                    {isAdmin ? (
                      <select
                        className="input-field p-1 text-xs capitalize"
                        value={project.visibility}
                        onChange={(e) => updateVisibility(project, e.target.value)}
                      >
                        <option value="org">Organization</option>
                        <option value="private">Private</option>
                      </select>
                    ) : (
                      <span className="badge capitalize">{project.visibility}</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="text-right">
                      <button aria-label={`Delete ${project.name}`} onClick={() => remove(project.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!projects.length && <div className="empty-state m-4">No projects yet.</div>}
        </section>
      </div>
    </PageShell>
  );
}
