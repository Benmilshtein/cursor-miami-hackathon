"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, UserPlus, Crown, Trash2 } from "lucide-react";

type Member = { userId: string; name: string | null; email: string; role: string };
type TeamDetails = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  votingGroup: "A" | "B" | null;
  memberCount: number;
  maxMembers: number;
  joinCode: string;
  members: Member[];
  captainUserId: string | null;
};

type UserOption = { id: string; name: string; email: string };

export default function AdminTeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = Number(params.teamId);
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignMakeLead, setAssignMakeLead] = useState(false);
  const [assignRemoveFromCurrent, setAssignRemoveFromCurrent] = useState(true);
  const [transferLeadUserId, setTransferLeadUserId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTeam = useCallback(async () => {
    if (!Number.isInteger(teamId) || teamId <= 0) {
      setError("Invalid team ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      const t = json.data as TeamDetails;
      setTeam(t);
      setEditName(t.name);
      setEditDescription(t.description ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load team");
      setTeam(null);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users?limit=200", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.users)) {
        setUsers(
          json.data.users.map((u: { id: string; name: string; email: string }) => ({
            id: u.id,
            name: u.name,
            email: u.email,
          })),
        );
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void fetchTeam();
    void fetchUsers();
  }, [fetchTeam, fetchUsers]);

  const handleSave = async () => {
    if (!team) return;
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editName.trim() || undefined,
          description: editDescription.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Save failed");
      setTeam(json.data);
      setActionSuccess("Team updated.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSetGroup = async (votingGroup: "A" | "B" | null) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ votingGroup }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to set group");
      setTeam(json.data);
      setActionSuccess(votingGroup ? `Moved to Group ${votingGroup}.` : "Group cleared.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to set group");
    }
  };

  const handleAssign = async () => {
    if (!assignUserId.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "assign-member",
          userId: assignUserId.trim(),
          makeLead: assignMakeLead,
          removeFromCurrentTeam: assignRemoveFromCurrent,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Assign failed");
      setTeam(json.data);
      setAssignUserId("");
      setActionSuccess("Member assigned.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Assign failed");
    }
  };

  const handleRemove = async (userId: string, nextLeadUserId?: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "remove-member",
          userId,
          ...(nextLeadUserId ? { nextLeadUserId } : {}),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Remove failed");
      setTeam(json.data);
      setActionSuccess("Member removed.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Remove failed");
    }
  };

  const handleTransferLead = async () => {
    if (!transferLeadUserId.trim()) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/membership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "transfer-lead",
          newLeadUserId: transferLeadUserId.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Transfer failed");
      setTeam(json.data);
      setTransferLeadUserId("");
      setActionSuccess("Lead transferred.");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Transfer failed");
    }
  };

  const handleDeleteTeam = async () => {
    if (!team) return;
    const typed = window.prompt(
      `Type the team name "${team.name}" to permanently delete this team and all related data (memberships, project, scores). This cannot be undone.`,
    );
    if (typed === null) return;
    if (typed.trim() !== team.name) {
      setActionError("Team name did not match. Nothing was deleted.");
      setActionSuccess(null);
      return;
    }
    setDeleting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Delete failed");
      router.replace("/admin/dashboard/teams");
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !team) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/dashboard/teams"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to teams
        </Link>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          {loading ? "Loading…" : error ?? "Team not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/dashboard/teams"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to teams
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{team.name}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            ID {team.id} · {team.memberCount}/{team.maxMembers} members · Join code:{" "}
            <span className="font-mono">{team.joinCode}</span>
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            team.status === "active"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
          }`}
        >
          {team.status}
        </span>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {actionSuccess}
        </div>
      )}

      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-white">Edit team</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">
              Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </section>

      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-white">Peer-voting group</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manually set this team&apos;s expo group. Only editable before voting opens.
          Currently:{" "}
          <span className="font-medium text-white">
            {team.votingGroup ? `Group ${team.votingGroup}` : "Unassigned"}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {(["A", "B"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => void handleSetGroup(g)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                team.votingGroup === g
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
                  : "border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              Group {g}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void handleSetGroup(null)}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            Unassign
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-white">Assign member</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Add a user to this team. Optionally make them lead or remove them from their current team.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="block text-sm text-[var(--text-muted)]">User</label>
            <select
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            >
              <option value="">Select user…</option>
              {users
                .filter((u) => !team.members.some((m) => m.userId === u.id))
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email} ({u.email})
                  </option>
                ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={assignMakeLead}
              onChange={(e) => setAssignMakeLead(e.target.checked)}
            />
            Make lead
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={assignRemoveFromCurrent}
              onChange={(e) => setAssignRemoveFromCurrent(e.target.checked)}
            />
            Remove from current team
          </label>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!assignUserId}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" /> Assign
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="text-lg font-semibold text-white">Members</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-left">
                <th className="pb-2 font-medium text-[var(--text-secondary)]">Name</th>
                <th className="pb-2 font-medium text-[var(--text-secondary)]">Email</th>
                <th className="pb-2 font-medium text-[var(--text-secondary)]">Role</th>
                <th className="pb-2 font-medium text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.members.map((m) => (
                <tr key={m.userId} className="border-b border-[var(--border-color)]/50">
                  <td className="py-2">
                    <span className="flex items-center gap-2 text-white">
                      {m.role === "lead" && <Crown className="h-4 w-4 text-amber-400" />}
                      {m.name || m.email}
                    </span>
                  </td>
                  <td className="py-2 text-[var(--text-secondary)]">{m.email}</td>
                  <td className="py-2">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{m.role}</span>
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(
                          m.userId,
                          m.role === "lead" && team.members.length > 1
                            ? team.members.find((x) => x.role !== "lead")?.userId
                            : undefined,
                        )
                      }
                      className="ml-2 text-xs text-red-400 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {team.captainUserId && team.members.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">Transfer lead to:</span>
            <select
              value={transferLeadUserId}
              onChange={(e) => setTransferLeadUserId(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-white"
            >
              <option value="">Select new lead…</option>
              {team.members
                .filter((m) => m.userId !== team.captainUserId)
                .map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.email}
                  </option>
                ))}
            </select>
            <button
              type="button"
              onClick={handleTransferLead}
              disabled={!transferLeadUserId}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-3 py-1.5 text-sm text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:opacity-50"
            >
              Transfer lead
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-200">Danger zone</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Permanently delete this team. Related memberships, invites, project, judge scores, and credit
          allocations for this team are removed. Users keep their accounts but are removed from this team.
        </p>
        <button
          type="button"
          onClick={() => void handleDeleteTeam()}
          disabled={deleting}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting…" : "Delete team permanently"}
        </button>
      </section>
    </div>
  );
}
