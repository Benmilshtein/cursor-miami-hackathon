"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mic, Plus, Trophy, X } from "lucide-react";

type RankedRow = {
  teamId: number;
  teamName: string;
  totalAvg: number;
  pitchAvg: number;
  pitchJudgeCount: number;
  isFinalist: boolean;
};

/**
 * Step 3 roster: promote the top N teams to the staged finals, then adjust by
 * hand. Finalists rank above everyone else on the public leaderboard and are
 * ordered by their pitch average.
 */
export default function FinalistsPanel() {
  const [ranking, setRanking] = useState<RankedRow[]>([]);
  const [pitchJudgeCount, setPitchJudgeCount] = useState(0);
  const [topN, setTopN] = useState(6);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/finalists", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      setRanking(json.data.ranking ?? []);
      setPitchJudgeCount(json.data.pitchJudgeCount ?? 0);
      if (typeof json.data.defaultTopN === "number") setTopN(json.data.defaultTopN);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load finalists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectTop = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finalists", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topN }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to select finalists");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (teamId: number, isFinalist: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/finalists", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, isFinalist }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update finalists");
    } finally {
      setBusy(false);
    }
  };

  const finalists = ranking.filter((r) => r.isFinalist);
  const nonFinalists = ranking.filter((r) => !r.isFinalist);

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <div className="mb-1 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
          <Trophy className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white">Finals</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Step 3. Finalists pitch on stage; the pitch score orders them above everyone else.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            How many finalists
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            className="mt-1 w-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void selectTop()}
          disabled={busy || loading}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
          Select top {topN} by build score
        </button>
        {finalists.length > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Mic className="h-3.5 w-3.5" />
            {pitchJudgeCount} {pitchJudgeCount === 1 ? "judge has" : "judges have"} scored pitches
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-[var(--text-muted)]">
        Re-running replaces the whole roster. Add or remove individual teams below.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-4 text-xs text-[var(--text-muted)]">Loading…</p>
      ) : finalists.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">
          No finalists selected yet.
        </p>
      ) : (
        <div className="mt-4 space-y-1.5">
          {finalists.map((r, i) => (
            <div
              key={r.teamId}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] px-3 py-2"
            >
              <span className="w-5 text-sm font-bold tabular-nums text-amber-400">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-white">{r.teamName}</span>
              <span className="text-xs text-[var(--text-muted)] tabular-nums">
                build {r.totalAvg.toFixed(1)}
              </span>
              <span
                className={`text-xs tabular-nums ${
                  r.pitchJudgeCount > 0 ? "text-emerald-400" : "text-[var(--text-muted)]"
                }`}
              >
                pitch {r.pitchAvg.toFixed(1)} ({r.pitchJudgeCount})
              </span>
              <button
                type="button"
                onClick={() => void toggle(r.teamId, false)}
                disabled={busy}
                title="Remove from finals"
                className="rounded p-1 text-[var(--text-muted)] hover:bg-white/5 hover:text-red-400 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-blue)] hover:underline"
          >
            <Plus className="h-3.5 w-3.5" />
            {showPicker ? "Hide team list" : "Add a team by hand"}
          </button>

          {showPicker && (
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-[var(--border-color)] p-2">
              {nonFinalists.length === 0 ? (
                <p className="px-2 py-1 text-xs text-[var(--text-muted)]">
                  Every team is already a finalist.
                </p>
              ) : (
                nonFinalists.map((r) => (
                  <div
                    key={r.teamId}
                    className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-white/5"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-secondary)]">
                      {r.teamName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums">
                      {r.totalAvg.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggle(r.teamId, true)}
                      disabled={busy}
                      className="rounded border border-[var(--border-color)] px-2 py-1 text-xs text-white hover:bg-white/5 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
