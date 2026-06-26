"use client";

import { Copy, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Project, TeamMember } from "@/lib/types";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviteUrl, setInviteUrl] = useState("");

  const refresh = () => apiGet<TeamMember[]>("/team/").then(setTeam).catch(() => setTeam([]));
  useEffect(() => { refresh(); apiGet<Project[]>("/projects/").then(setProjects).catch(() => setProjects([])); }, []);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    const response = await apiPost<{ invite_url: string }>("/team/invitations", { email, role, project_ids: projects.map((project) => project.id) });
    setInviteUrl(response.invite_url);
    setEmail("");
  };

  const remove = async (id: string) => { await apiDelete(`/team/${id}`); await refresh(); };
  const updateRole = async (id: string, newRole: string) => { await apiPatch(`/team/${id}`, { role: newRole, project_ids: projects.map((p) => p.id) }); await refresh(); };

  return (
    <PageShell title="Team" description="Members inherit only assigned project access.">
      <form onSubmit={invite} className="panel mb-6 flex flex-col gap-3 p-4 md:flex-row">
        <input className="input-field flex-1" type="email" placeholder="teammate@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <select className="input-field max-w-40" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn-primary"><UserPlus size={16} /> Invite</button>
      </form>
      {inviteUrl && <div className="mb-5 flex w-full items-center gap-2 border-2 border-black bg-[var(--lime)] p-3 text-left text-sm font-bold">Invitation email sent successfully!</div>}
      <div className="panel overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Member</th><th>Role</th><th>Projects</th><th /></tr></thead>
          <tbody>{team.map((member) => (
            <tr key={member.id}>
              <td><b>{member.name}</b><div className="mono text-[10px] text-[var(--muted)]">{member.email}</div></td>
              <td>
                <select className="input-field p-1 text-xs" value={member.role} onChange={(e) => updateRole(member.id, e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>{member.projects.join(", ") || "None"}</td>
              <td className="text-right"><button aria-label={`Remove ${member.name}`} onClick={() => remove(member.id)}><Trash2 size={16} /></button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </PageShell>
  );
}
