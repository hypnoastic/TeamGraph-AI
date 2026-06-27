"use client";

import { Copy, Trash2, UserPlus, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/page-shell";
import { LoadingButton } from "@/components/loading-button";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Project, TeamMember, TeamInvitation } from "@/lib/types";

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    apiGet<TeamMember[]>("/team").then(setTeam).catch(() => setTeam([]));
    apiGet<TeamInvitation[]>("/team/invitations").then(setInvitations).catch(() => setInvitations([]));
  };
  
  useEffect(() => { refresh(); apiGet<Project[]>("/projects").then(setProjects).catch(() => setProjects([])); }, []);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await apiPost<{ invite_url: string }>("/team/invitations", { email, role, project_ids: projects.map((project) => project.id) });
      setInviteUrl(response.invite_url);
      setEmail("");
      refresh();
    } finally {
      setBusy(false);
    }
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
        <LoadingButton type="submit" busy={busy} busyLabel="Working..." label="Invite" className="btn-primary"><UserPlus size={16} /></LoadingButton>
      </form>
      {inviteUrl && <div className="mb-5 flex w-full items-center gap-2 border-2 border-black bg-[var(--lime)] p-3 text-left text-sm font-bold">Invitation email sent successfully!</div>}
      
      <div className="panel overflow-x-auto mb-8">
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

      {invitations.length > 0 && (
        <>
          <h2 className="mb-4 text-xl font-bold">Invitations</h2>
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>{invitations.map((inv) => (
                <tr key={inv.id}>
                  <td><div className="mono text-[12px]">{inv.email}</div></td>
                  <td className="capitalize">{inv.role}</td>
                  <td>
                    {inv.status === "pending" ? (
                      <span className="flex items-center gap-1 text-[var(--muted)] text-xs font-bold uppercase tracking-wider"><Clock size={12} /> Pending</span>
                    ) : (
                      <span className="text-green-600 text-xs font-bold uppercase tracking-wider">Accepted</span>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </PageShell>
  );
}
