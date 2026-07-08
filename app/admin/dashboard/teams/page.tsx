"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Shuffle } from "lucide-react";
import PeerVotingPanel from "@/components/admin/PeerVotingPanel";

type MatchingResult = {
  poolSize: number;
  teamsFormed: number;
  matchedUsers: number;
  waitlisted: number;
};

type TeamItem = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  votingGroup: "A" | "B" | null;
  memberCount: number;
  maxMembers: number;
  joinCode: string;
  createdAt: string;
  lead: { userId: string; name: string | null; email: string } | null;
};

type ListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: TeamItem[];
};

export default function AdminTeamsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "active" | "archived">("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchingResult | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const fetchPool = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/teams/run-matching", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) setPoolSize(json.data.poolSize as number);
    } catch {
      // Non-critical — leave poolSize as-is.
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/teams?${params}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load teams");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [offset, search, status]);

  useEffect(() => {
    void fetchTeams();
    void fetchPool();
  }, [fetchTeams, fetchPool]);

  const runMatching = useCallback(async () => {
    setMatching(true);
    setMatchError(null);
    setMatchResult(null);
    try {
      const res = await fetch("/api/admin/teams/run-matching", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      setMatchResult(json.data as MatchingResult);
      await Promise.all([fetchPool(), fetchTeams()]);
    } catch (e) {
      setMatchError(e instanceof Error ? e.message : "Failed to run matching");
    } finally {
      setMatching(false);
    }
  }, [fetchPool, fetchTeams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Teams</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          View and edit all teams. Click a row to manage membership.
        </p>
      </div>

      {/* Auto-matching panel */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-purple)]/20">
              <Shuffle className="h-5 w-5 text-[var(--accent-purple)]" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Auto-match teams</h2>
              <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                {poolSize === null
                  ? "Shuffle opted-in participants into balanced teams."
                  : `${poolSize} participant${poolSize === 1 ? "" : "s"} waiting in the match pool.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void runMatching()}
            disabled={matching || (poolSize !== null && poolSize < 4)}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-purple)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Shuffle className="h-4 w-4" />
            {matching ? "Matching…" : "Run team matching"}
          </button>
        </div>

        {matchResult ? (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            Formed {matchResult.teamsFormed} team{matchResult.teamsFormed === 1 ? "" : "s"} from{" "}
            {matchResult.matchedUsers} participant{matchResult.matchedUsers === 1 ? "" : "s"}.{" "}
            {matchResult.waitlisted > 0
              ? `${matchResult.waitlisted} still waiting (need a multiple of 4).`
              : "Everyone in the pool got a team."}
          </div>
        ) : null}
        {matchError ? (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {matchError}
          </div>
        ) : null}
      </div>

      <PeerVotingPanel onChange={() => void fetchTeams()} />

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search by name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            onKeyDown={(e) => e.key === "Enter" && fetchTeams()}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] py-2 pl-10 pr-4 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as "" | "active" | "archived");
            setOffset(0);
          }}
          className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
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
      ) : data ? (
        <>
          <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Name</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Group</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Members</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Join code</th>
                    <th className="px-4 py-3 font-medium text-[var(--text-secondary)]">Lead</th>
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">
                        No teams found.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((team) => (
                      <tr
                        key={team.id}
                        className="border-b border-[var(--border-color)]/50 transition-colors hover:bg-[var(--bg-secondary)]/30"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/dashboard/teams/${team.id}`}
                            className="font-medium text-white hover:text-[var(--accent-blue)]"
                          >
                            {team.name}
                          </Link>
                          {team.description ? (
                            <p className="mt-0.5 truncate max-w-[200px] text-xs text-[var(--text-muted)]">
                              {team.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              team.status === "active"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-[var(--text-muted)]/20 text-[var(--text-muted)]"
                            }`}
                          >
                            {team.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {team.votingGroup ? (
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                team.votingGroup === "A"
                                  ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
                                  : "bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]"
                              }`}
                            >
                              {team.votingGroup}
                            </span>
                          ) : (
                            <span className="text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {team.memberCount} / {team.maxMembers}
                        </td>
                        <td className="px-4 py-3 font-mono text-[var(--text-secondary)]">
                          {team.joinCode}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-secondary)]">
                          {team.lead ? (
                            <span className="truncate max-w-[180px] block" title={team.lead.email}>
                              {team.lead.name || team.lead.email}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/dashboard/teams/${team.id}`}
                            className="inline-flex text-[var(--text-muted)] hover:text-white"
                            aria-label="Edit team"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
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
