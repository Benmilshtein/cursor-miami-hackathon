"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  ExternalLink,
  FolderGit2,
  Search,
  Trash2,
} from "lucide-react";

type ProjectItem = {
  id: string;
  teamId: number;
  teamName: string;
  name: string;
  description: string | null;
  githubUrl: string;
  demoUrl: string | null;
  techStack: string | null;
  slidesUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type ListResponse = {
  total: number;
  limit: number;
  offset: number;
  projects: ProjectItem[];
};

export default function AdminProjectsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [deadline, setDeadline] = useState<string>("");
  const [deadlineLoading, setDeadlineLoading] = useState(true);
  const [deadlineSaving, setDeadlineSaving] = useState(false);
  const [deadlineNotice, setDeadlineNotice] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/projects?${params}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchDeadline = useCallback(async () => {
    setDeadlineLoading(true);
    try {
      const res = await fetch("/api/admin/settings/project-deadline", {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success && json.data?.deadline) {
        setDeadline(toDatetimeLocal(json.data.deadline));
      }
    } catch {
      // ignore
    } finally {
      setDeadlineLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    void fetchDeadline();
  }, [fetchDeadline]);

  useEffect(() => {
    if (!deadlineNotice) return;
    const t = setTimeout(() => setDeadlineNotice(null), 4000);
    return () => clearTimeout(t);
  }, [deadlineNotice]);

  // Event timezone offset from UTC in hours; change to match your event's timezone.
  const EVENT_TZ_OFFSET_HOURS = 0;

  // Converts an ISO string to a datetime-local value displayed in the event timezone.
  function toDatetimeLocal(iso: string) {
    const d = new Date(iso);
    const local = new Date(d.getTime() + EVENT_TZ_OFFSET_HOURS * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  }

  // Interprets a datetime-local string as event time and converts to ISO UTC.
  function fromEventTimeToISO(datetimeLocal: string): string {
    const [datePart, timePart] = datetimeLocal.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);
    return new Date(Date.UTC(year, month - 1, day, hours - EVENT_TZ_OFFSET_HOURS, minutes)).toISOString();
  }

  async function handleSaveDeadline() {
    setDeadlineSaving(true);
    try {
      const value = deadline ? fromEventTimeToISO(deadline) : null;
      const res = await fetch("/api/admin/settings/project-deadline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deadline: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to save");
      if (json.data?.deadline) {
        setDeadline(toDatetimeLocal(json.data.deadline));
      } else {
        setDeadline("");
      }
      setDeadlineNotice("Deadline saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save deadline");
    } finally {
      setDeadlineSaving(false);
    }
  }

  async function handleClearDeadline() {
    setDeadline("");
    setDeadlineSaving(true);
    try {
      const res = await fetch("/api/admin/settings/project-deadline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deadline: null }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Failed to clear");
      }
      setDeadlineNotice("Deadline removed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear deadline");
    } finally {
      setDeadlineSaving(false);
    }
  }

  async function handleDelete(projectId: string, name: string) {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Delete failed");
      if (data) {
        setData({
          ...data,
          projects: data.projects.filter((p) => p.id !== projectId),
          total: Math.max(0, data.total - 1),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          View and manage hackathon project submissions. Set a deadline for submissions.
        </p>
      </div>

      {/* Deadline setting */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-white">Submission Deadline</h2>
        </div>
        {deadlineLoading ? (
          <div className="h-11 w-64 animate-pulse rounded-lg bg-white/10" />
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                Deadline (UTC)
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="h-11 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none focus:border-[var(--accent-blue)]"
              />
            </div>
            <button
              type="button"
              onClick={handleSaveDeadline}
              disabled={deadlineSaving}
              className="h-11 rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-4 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:opacity-50"
            >
              {deadlineSaving ? "Saving…" : "Save"}
            </button>
            {deadline && (
              <button
                type="button"
                onClick={handleClearDeadline}
                disabled={deadlineSaving}
                className="h-11 rounded-lg border border-red-500/30 px-4 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {deadlineNotice && (
          <p className="mt-2 text-sm text-emerald-300">{deadlineNotice}</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search by project or team name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchProjects()}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-10 pr-4 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void fetchProjects()}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : data ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                      Project
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                      Team
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                      Tech Stack
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                      Links
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)] min-w-[140px]">
                      Submitted
                    </th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)] w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-[var(--text-muted)]"
                      >
                        <FolderGit2 className="mx-auto h-8 w-8 mb-2 opacity-40" />
                        No projects submitted yet.
                      </td>
                    </tr>
                  ) : (
                    data.projects.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[var(--border-color)]/50 transition-colors hover:bg-[var(--bg-secondary)]/30"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-white">{p.name}</p>
                          {p.description && (
                            <p className="mt-0.5 text-xs text-[var(--text-muted)] line-clamp-2">
                              {p.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {p.teamName}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)] text-xs">
                          {p.techStack || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <a
                              href={p.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs text-white hover:bg-white/5"
                            >
                              GitHub
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {p.demoUrl && (
                              <a
                                href={p.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs text-white hover:bg-white/5"
                              >
                                Demo
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {p.slidesUrl && (
                              <a
                                href={p.slidesUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs text-white hover:bg-white/5"
                              >
                                Slides
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                            {p.videoUrl && (
                              <a
                                href={p.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs text-white hover:bg-white/5"
                              >
                                Video
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                          <div>
                            {new Date(p.createdAt).toLocaleString(undefined, { timeZone: "UTC" })}
                          </div>
                          {p.updatedAt !== p.createdAt && (
                            <div className="mt-0.5 text-[var(--text-muted)]">
                              upd: {new Date(p.updatedAt).toLocaleString(undefined, { timeZone: "UTC" })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            title="Delete project"
                            disabled={deletingId === p.id}
                            onClick={() => void handleDelete(p.id, p.name)}
                            className="inline-flex items-center justify-center rounded-lg border border-red-500/40 p-2 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      ) : null}
    </div>
  );
}
