"use client";

import { useCallback, useState } from "react";
import { AlertTriangle, Check, ChevronDown, ChevronRight, FileText, Loader2, X } from "lucide-react";

export type RequirementFlags = {
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  onTime: boolean;
};

type Kind = "prd" | "cursorrules";

type Loaded = { path: string; content: string; truncated: boolean };

/** Green/red pass-fail chip. Shared by the judge dashboard and both admin views. */
export function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
        ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
      }`}
    >
      {ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

/**
 * The three step-1 requirements at a glance. `null` means the repo check has
 * never been run for this team - not the same as failing it.
 */
export function RequirementBadges({ check }: { check: RequirementFlags | null }) {
  if (!check) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        Repo not checked
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Flag ok={check.hasPrd} label="PRD" />
      <Flag ok={check.hasCursorRules} label=".cursorrules" />
      <Flag ok={check.hasAppUrl} label="URL" />
      {!check.onTime && (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
          <AlertTriangle className="h-2.5 w-2.5" />
          Late
        </span>
      )}
    </div>
  );
}

/**
 * Read a team's PRD and `.cursorrules` without leaving the dashboard.
 *
 * Content is fetched server-side (`/api/judging/repo-file`) because teams'
 * repos are private - a link to github.com would 404 for any reviewer who is
 * not a collaborator.
 *
 * ponytail: raw text in a <pre>, not rendered markdown. A PRD read once during
 * judging does not justify a markdown dependency; add react-markdown only if
 * reviewers say the source is unreadable.
 */
export default function RepoFileViewer({
  teamId,
  check,
}: {
  teamId: number;
  check: RequirementFlags | null;
}) {
  const [open, setOpen] = useState<Kind | null>(null);
  const [cache, setCache] = useState<Partial<Record<Kind, Loaded>>>({});
  const [loading, setLoading] = useState<Kind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = useCallback(
    async (kind: Kind) => {
      setError(null);
      if (open === kind) {
        setOpen(null);
        return;
      }
      setOpen(kind);
      if (cache[kind]) return;

      setLoading(kind);
      try {
        const res = await fetch(`/api/judging/repo-file?teamId=${teamId}&kind=${kind}`, {
          credentials: "include",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
        }
        setCache((prev) => ({ ...prev, [kind]: json.data as Loaded }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load the file.");
        setOpen(null);
      } finally {
        setLoading(null);
      }
    },
    [cache, open, teamId],
  );

  // Nothing to read until the check has found the files.
  if (!check?.hasPrd && !check?.hasCursorRules) return null;

  const shown = open ? cache[open] : undefined;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["prd", "PRD", check?.hasPrd ?? false],
            ["cursorrules", ".cursorrules", check?.hasCursorRules ?? false],
          ] as Array<[Kind, string, boolean]>
        )
          .filter(([, , present]) => present)
          .map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() => void toggle(kind)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                open === kind
                  ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]"
                  : "border-[var(--border-color)] text-white hover:bg-white/5"
              }`}
            >
              {loading === kind ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : open === kind ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              <FileText className="h-3.5 w-3.5 opacity-70" />
              Read {label}
            </button>
          ))}
      </div>

      {error && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      {shown && (
        <div className="mt-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] px-3 py-2">
            <code className="truncate text-[11px] text-[var(--text-muted)]">{shown.path}</code>
            {shown.truncated && (
              <span className="shrink-0 text-[10px] font-medium text-amber-400">truncated</span>
            )}
          </div>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words px-3 py-2 text-[11px] leading-relaxed text-[var(--text-secondary)]">
            {shown.content}
          </pre>
        </div>
      )}
    </div>
  );
}
