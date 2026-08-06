"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import RepoFileViewer, { RequirementBadges } from "@/components/judging/RepoFileViewer";

type RepoCheckRow = {
  teamId: number;
  teamName: string;
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  onTime: boolean;
  details: string | null;
  checkedAt: string;
};

type Details = { error?: string | null };

/** `<input type="datetime-local">` wants `YYYY-MM-DDTHH:mm` in local time. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Step 1 of judging: set the hackathon start time, then run the automated
 * GitHub requirements check (PRD, .cursorrules, public app URL, all within the
 * first hour). Results are cached and read by judges - this is the only place
 * that talks to GitHub.
 */
export default function RepoCheckPanel() {
  const [checks, setChecks] = useState<RepoCheckRow[]>([]);
  const [startAt, setStartAt] = useState("");
  const [savedStartAt, setSavedStartAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/repo-check", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      setChecks(json.data.checks ?? []);
      const local = toLocalInput(json.data.hackathonStartAt ?? null);
      setStartAt(local);
      setSavedStartAt(local);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load repo checks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveStartAt = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/repo-check", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonStartAt: startAt ? new Date(startAt).toISOString() : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      setSavedStartAt(startAt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save start time");
    } finally {
      setSaving(false);
    }
  };

  const runCheck = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/repo-check", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      setChecks(json.data.checks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to run the check");
    } finally {
      setRunning(false);
    }
  };

  const passing = checks.filter((c) => c.onTime).length;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white">Repo requirements check</h2>
        {checks.length > 0 && (
          <span className="text-xs text-[var(--text-muted)] tabular-nums">
            {passing} / {checks.length} passing
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Step 1 of judging. Verifies each team committed a PRD and a .cursorrules file,
        and submitted a public app URL, within the first hour after the start time.
        A failing team is flagged, not disqualified.
      </p>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Hackathon start (T0)
          </label>
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void saveStartAt()}
          disabled={saving || startAt === savedStartAt}
          className="rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-white hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => void runCheck()}
          disabled={running || !savedStartAt}
          title={savedStartAt ? undefined : "Set the start time first"}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)]/20 px-3 py-2 text-xs font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {running ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {running ? "Checking all teams…" : "Run repo check"}
        </button>
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-xs text-[var(--text-muted)]">Loading…</p>
      ) : checks.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)]">
          No results yet. Set the start time, then run the check.
        </p>
      ) : (
        <div className="space-y-1.5">
          {checks.map((c) => {
            let reason: string | null = null;
            try {
              reason = (JSON.parse(c.details ?? "{}") as Details).error ?? null;
            } catch {
              reason = null;
            }
            return (
              <div
                key={c.teamId}
                className="rounded-lg border border-[var(--border-color)] px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-white">{c.teamName}</span>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    #{c.teamId}
                  </span>
                  <RequirementBadges check={c} />
                  {reason && (
                    <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--text-muted)]">
                      {reason}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <RepoFileViewer teamId={c.teamId} check={c} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
