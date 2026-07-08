"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Play, Square, RotateCcw, Search, Pause } from "lucide-react";

type TeamItem = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  joinCode: string;
  screeningStatus: string;
  screeningSubmittedAt: string | null;
  screeningRejectedAt: string | null;
  screeningApprovedAt: string | null;
  createdAt: string;
  lead: { userId: string; name: string | null; email: string } | null;
};

type ScreeningPhase = "registration" | "screening_active" | "screening_completed";

const PHASE_CONFIG: Record<ScreeningPhase, { label: string; color: string; bg: string }> = {
  registration: { label: "Registration", color: "text-[var(--text-secondary)]", bg: "bg-white/5 border-white/10" },
  screening_active: { label: "Screening active", color: "text-[var(--accent-blue)]", bg: "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]/30" },
  screening_completed: { label: "Screening completed", color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/30" },
};

export default function AdminScreeningPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("submitted");
  const [search, setSearch] = useState("");
  const [phase, setPhase] = useState<ScreeningPhase>("registration");
  const [phaseLoading, setPhaseLoading] = useState(true);
  const [phaseUpdating, setPhaseUpdating] = useState(false);

  const fetchPhase = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/screening/phase", { credentials: "include" });
      const json = await res.json();
      if (json?.success) setPhase(json.data.phase);
    } catch {
      // ignore
    } finally {
      setPhaseLoading(false);
    }
  }, []);

  const updatePhase = async (newPhase: ScreeningPhase) => {
    setPhaseUpdating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/screening/phase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phase: newPhase }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to update");
      setPhase(newPhase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update phase");
    } finally {
      setPhaseUpdating(false);
    }
  };

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("all", "true");
      if (statusFilter) params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/admin/screening/teams?${params}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load");
      setTeams(json.data.teams ?? []);
      setTotal(json.data.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void fetchPhase();
    void fetchTeams();
  }, [fetchPhase, fetchTeams]);

  const phaseDisplay = PHASE_CONFIG[phase];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Screening</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Review team applications. Approve or reject after checking materials.
        </p>
      </div>

      {/* Screening Phase Control */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-muted)]">Current phase:</span>
            {phaseLoading ? (
              <span className="text-sm text-[var(--text-muted)]">Loading…</span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${phaseDisplay.bg} ${phaseDisplay.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  phase === "screening_active" ? "bg-[var(--accent-blue)]" : phase === "screening_completed" ? "bg-emerald-400" : "bg-white/40"
                }`} />
                {phaseDisplay.label}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {phase === "registration" && (
              <button
                type="button"
                onClick={() => void updatePhase("screening_active")}
                disabled={phaseUpdating}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {phaseUpdating ? "Starting…" : "Start screening"}
              </button>
            )}
            {phase === "screening_active" && (
              <>
                <button
                  type="button"
                  onClick={() => void updatePhase("registration")}
                  disabled={phaseUpdating}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  {phaseUpdating ? "…" : "Stop (registration)"}
                </button>
                <button
                  type="button"
                  onClick={() => void updatePhase("screening_completed")}
                  disabled={phaseUpdating}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600/90 disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  {phaseUpdating ? "Completing…" : "Complete screening"}
                </button>
              </>
            )}
            {phase === "screening_completed" && (
              <button
                type="button"
                onClick={() => void updatePhase("registration")}
                disabled={phaseUpdating}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                {phaseUpdating ? "Resetting…" : "Reset to registration"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search by team name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTeams()}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-10 pr-4 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">In review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="button"
          onClick={() => void fetchTeams()}
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

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          No teams with the selected status.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Team</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Submitted</th>
                <th className="px-6 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-[var(--bg-secondary)]/30">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{team.name}</p>
                    {team.lead && (
                      <p className="text-sm text-[var(--text-muted)]">{team.lead.email}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        team.screeningStatus === "submitted"
                          ? "bg-amber-500/20 text-amber-200"
                          : team.screeningStatus === "approved"
                            ? "bg-green-500/20 text-green-200"
                            : team.screeningStatus === "rejected"
                              ? "bg-red-500/20 text-red-200"
                              : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      }`}
                    >
                      {team.screeningStatus === "draft"
                        ? "Draft"
                        : team.screeningStatus === "submitted"
                          ? "In review"
                          : team.screeningStatus === "approved"
                            ? "Approved"
                            : "Rejected"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)]">{team.memberCount}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                    {team.screeningSubmittedAt
                      ? new Date(team.screeningSubmittedAt).toLocaleString()
                      : " - "}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/dashboard/screening/${team.id}`}
                      className="inline-flex items-center text-[var(--accent-blue)] hover:underline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
