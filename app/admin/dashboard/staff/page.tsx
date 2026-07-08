"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, Gavel, Users, Trash2, XCircle } from "lucide-react";

type StaffInvite = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function AdminStaffPage() {
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"judge" | "mentor">("judge");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [removingScoresId, setRemovingScoresId] = useState<string | null>(null);
  const [scoresNotice, setScoresNotice] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff-invites", { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setInvites(json.data.invites ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load invites");
      setInvites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaffUsers = useCallback(async () => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      const [judgesRes, mentorsRes] = await Promise.all([
        fetch("/api/admin/users?role=judge&limit=200", { credentials: "include" }),
        fetch("/api/admin/users?role=mentor&limit=200", { credentials: "include" }),
      ]);
      const [judgesJson, mentorsJson] = await Promise.all([
        judgesRes.json(),
        mentorsRes.json(),
      ]);
      const judges: StaffUser[] = judgesJson?.data?.users ?? [];
      const mentors: StaffUser[] = mentorsJson?.data?.users ?? [];
      setStaffUsers([...judges, ...mentors]);
    } catch (e) {
      setStaffError(e instanceof Error ? e.message : "Failed to load staff");
      setStaffUsers([]);
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInvites();
    void fetchStaffUsers();
  }, [fetchInvites, fetchStaffUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setSubmitError("Enter an email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: trimmed, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json?.error?.message ?? "Failed to send invite.");
        setSubmitting(false);
        return;
      }
      if (json.data?.invite) {
        setInvites((prev) => [json.data.invite, ...prev]);
        setEmail("");
      }
    } catch {
      setSubmitError("Request failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, name: string, role: string) => {
    if (deletingUserId) return;
    if (!window.confirm(`Permanently delete ${role} "${name}"? This cannot be undone.`)) return;
    setStaffError(null);
    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Delete failed");
      setStaffUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      setStaffError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRemoveScores = async (userId: string, name: string) => {
    if (removingScoresId) return;
    if (!window.confirm(`Remove all scores submitted by "${name}"? The ranking will be recalculated. This cannot be undone.`)) return;
    setStaffError(null);
    setRemovingScoresId(userId);
    try {
      const res = await fetch(`/api/admin/scores/judge/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to remove scores");
      const count: number = json?.data?.deleted ?? 0;
      setScoresNotice(`Removed ${count} score${count !== 1 ? "s" : ""} by "${name}". Ranking recalculated.`);
    } catch (e) {
      setStaffError(e instanceof Error ? e.message : "Failed to remove scores");
    } finally {
      setRemovingScoresId(null);
    }
  };

  useEffect(() => {
    if (!scoresNotice) return;
    const t = setTimeout(() => setScoresNotice(null), 5000);
    return () => clearTimeout(t);
  }, [scoresNotice]);

  const handleDelete = async (inviteId: string) => {
    if (deletingId) return;
    setDeletingId(inviteId);
    try {
      const res = await fetch(`/api/admin/staff-invites/${inviteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Delete failed");
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete invite");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Judges & Mentors</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Invite judges and mentors by email. They will receive a magic link to set up their account (email/password only).
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <UserPlus className="h-5 w-5" />
          Send invite
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="judge@example.com"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "judge" | "mentor")}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            >
              <option value="judge">Judge</option>
              <option value="mentor">Mentor</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg border border-[var(--accent-blue)] bg-[var(--accent-blue)]/20 px-4 py-2.5 font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:opacity-50"
          >
            {submitting ? "Sending…" : "Send invite"}
          </button>
        </form>
        {submitError && (
          <p className="mt-3 text-sm text-red-400">{submitError}</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold text-white">
              <Users className="h-4 w-4" />
              Invites
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Role
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Expires
                  </th>
                  <th className="w-10 px-4 py-3" aria-label="Delete" />
                </tr>
              </thead>
              <tbody>
                {invites.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-[var(--text-muted)]"
                    >
                      No invites yet. Send one above.
                    </td>
                  </tr>
                ) : (
                  invites.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--border-color)]/50"
                    >
                      <td className="px-4 py-3 text-white">{inv.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Gavel className="h-3.5 w-3.5" />
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {inv.acceptedAt ? (
                          <span className="text-emerald-400">Accepted</span>
                        ) : (
                          <span className="text-amber-400">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id)}
                          disabled={deletingId === inv.id}
                          className="rounded p-1.5 text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                          title="Delete invite"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Gavel className="h-4 w-4" />
            Registered Staff
          </h2>
        </div>

        {staffError && (
          <div className="mx-4 mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {staffError}
          </div>
        )}

        {scoresNotice && (
          <div className="mx-4 mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {scoresNotice}
          </div>
        )}

        {staffLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                    Role
                  </th>
                  <th className="w-24 px-4 py-3 font-medium text-[var(--text-secondary)]" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {staffUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-[var(--text-muted)]"
                    >
                      No registered judges or mentors yet.
                    </td>
                  </tr>
                ) : (
                  staffUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--border-color)]/50"
                    >
                      <td className="px-4 py-3 font-medium text-white">
                        {u.name || " - "}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1">
                          <Gavel className="h-3.5 w-3.5" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {u.role === "judge" && (
                            <button
                              type="button"
                              onClick={() => void handleRemoveScores(u.id, u.name || u.email)}
                              disabled={removingScoresId === u.id}
                              className="rounded p-1.5 text-[var(--text-muted)] hover:bg-amber-500/20 hover:text-amber-400 disabled:opacity-50"
                              title="Remove all scores by this judge"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleDeleteUser(u.id, u.name || u.email, u.role)}
                            disabled={deletingUserId === u.id}
                            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
