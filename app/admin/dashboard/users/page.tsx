"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Trash2 } from "lucide-react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: number | null;
  createdAt: string;
};

type ListResponse = {
  total: number;
  limit: number;
  offset: number;
  users: UserItem[];
};

const ROLES = [
  "participant",
  "moderator",
  "reviewer",
  "super_admin",
  "judge",
  "mentor",
] as const;

const DELETABLE_ROLES = new Set<string>(["participant", "judge", "mentor"]);

export default function AdminUsersPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [offset, setOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [offset, search, roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!ROLES.includes(newRole as (typeof ROLES)[number])) return;
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Update failed");
      if (data) {
        setData({
          ...data,
          users: data.users.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u,
          ),
        });
      }
    } catch {
      // could set a toast/error
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, email: string, role: string) => {
    const teamNote =
      role === "participant"
        ? " Their team will be updated (lead passes to another member if needed)."
        : "";
    if (
      !window.confirm(
        `Permanently delete ${role} ${email}? This cannot be undone.${teamNote}`,
      )
    ) {
      return;
    }
    setDeleteError(null);
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Delete failed");
      }
      if (data) {
        setData({
          ...data,
          users: data.users.filter((u) => u.id !== userId),
          total: Math.max(0, data.total - 1),
        });
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          View and change user roles. Super admins can permanently delete participants, judges, and mentors.
          Team membership is managed from the team detail page.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-10 pr-4 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setOffset(0);
          }}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30"
        >
          Apply
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {deleteError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : data ? (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Name</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Email</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Role</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Team ID</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)] w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    data.users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-[var(--border-color)]/50 transition-colors hover:bg-[var(--bg-secondary)]/30"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {u.name || " - "}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={updatingId === u.id}
                            className="rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 text-white disabled:opacity-50 focus:border-[var(--accent-blue)] focus:outline-none"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">
                          {u.teamId ?? " - "}
                        </td>
                        <td className="px-4 py-3">
                          {DELETABLE_ROLES.has(u.role) ? (
                            <button
                              type="button"
                              title={`Delete ${u.role}`}
                              disabled={deletingId === u.id}
                              onClick={() => void handleDeleteUser(u.id, u.email, u.role)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-500/40 p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          ) : (
                            <span className="text-[var(--text-muted)]"> - </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {data.total > limit && (
            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <span>
                Showing {offset + 1}–{Math.min(offset + limit, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset((o) => Math.max(0, o - limit))}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 disabled:opacity-50 hover:bg-[var(--bg-secondary)]"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={offset + limit >= data.total}
                  onClick={() => setOffset((o) => o + limit)}
                  className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 disabled:opacity-50 hover:bg-[var(--bg-secondary)]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
