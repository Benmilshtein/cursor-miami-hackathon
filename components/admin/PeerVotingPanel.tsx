"use client";

import { useCallback, useEffect, useState } from "react";
import { Vote, SplitSquareHorizontal, Trophy, RotateCcw } from "lucide-react";

type Phase = "closed" | "round_1" | "round_2" | "finished";

type Overview = {
  phase: Phase;
  groups: { A: number; B: number; unassigned: number; total: number };
  totalVotes: number;
  groupsEditable: boolean;
};

type LeaderboardRow = {
  teamId: number;
  teamName: string;
  votingGroup: "A" | "B" | null;
  totalCredits: number;
  uniqueVoters: number;
  rank: number;
};

const PHASE_LABEL: Record<Phase, string> = {
  closed: "Closed: voting not started",
  round_1: "Round 1 · Group A presents, Group B votes",
  round_2: "Round 2 · Group B presents, Group A votes",
  finished: "Finished: all votes locked",
};

const NEXT_ACTION: Record<Phase, { to: Phase; label: string } | null> = {
  closed: { to: "round_1", label: "Start Round 1 (A presents · B votes)" },
  round_1: { to: "round_2", label: "Start Round 2 (B presents · A votes)" },
  round_2: { to: "finished", label: "End voting" },
  finished: null,
};

export default function PeerVotingPanel({ onChange }: { onChange?: () => void }) {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[] | null>(null);
  const [showBoard, setShowBoard] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/peer-voting/phase", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setOverview(json.data as Overview);
    } catch {
      // Non-critical.
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/peer-voting/leaderboard", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setLeaderboard(json.data.leaderboard as LeaderboardRow[]);
    } catch {
      // Non-critical.
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const post = useCallback(
    async (url: string, body?: unknown, method: "POST" | "PATCH" = "POST") => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(url, {
          method,
          credentials: "include",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
        }
        await fetchOverview();
        onChange?.();
        if (showBoard) await fetchLeaderboard();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setBusy(false);
      }
    },
    [fetchOverview, fetchLeaderboard, onChange, showBoard],
  );

  const next = overview ? NEXT_ACTION[overview.phase] : null;
  const editable = overview?.groupsEditable ?? false;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <Vote className="h-5 w-5 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Peer voting expo</h2>
            <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
              {overview ? PHASE_LABEL[overview.phase] : "Loading…"}
            </p>
            {overview ? (
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Group A: {overview.groups.A} · Group B: {overview.groups.B}
                {overview.groups.unassigned > 0
                  ? ` · Unassigned: ${overview.groups.unassigned}`
                  : ""}{" "}
                · {overview.totalVotes} vote{overview.totalVotes === 1 ? "" : "s"} cast
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void post("/api/admin/peer-voting/split")}
          disabled={busy || !editable}
          title={!editable ? "Groups lock once voting opens or votes are cast." : undefined}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-purple)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-purple)] hover:bg-[var(--accent-purple)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SplitSquareHorizontal className="h-4 w-4" />
          Split into 2 groups
        </button>

        {next ? (
          <button
            type="button"
            onClick={() => void post("/api/admin/peer-voting/phase", { phase: next.to }, "PATCH")}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {next.label}
          </button>
        ) : null}

        {overview && overview.phase !== "closed" ? (
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Reset peer voting to closed? This re-opens group editing.")) {
                void post("/api/admin/peer-voting/phase", { phase: "closed" }, "PATCH");
              }
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => {
            const nextShow = !showBoard;
            setShowBoard(nextShow);
            if (nextShow) void fetchLeaderboard();
          }}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        >
          <Trophy className="h-4 w-4" />
          {showBoard ? "Hide leaderboard" : "Show leaderboard"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {showBoard && leaderboard ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border-color)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)]">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Team</th>
                <th className="px-3 py-2 font-medium">Group</th>
                <th className="px-3 py-2 font-medium">Credits</th>
                <th className="px-3 py-2 font-medium">Voters</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[var(--text-muted)]">
                    No votes yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => (
                  <tr key={row.teamId} className="border-b border-[var(--border-color)]/50">
                    <td className="px-3 py-2 text-[var(--text-muted)]">{row.rank}</td>
                    <td className="px-3 py-2 font-medium text-white">{row.teamName}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.votingGroup ?? "—"}</td>
                    <td className="px-3 py-2 font-semibold text-[var(--accent-blue)]">{row.totalCredits}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{row.uniqueVoters}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
