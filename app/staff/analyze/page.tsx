"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  Github,
  Loader2,
  BarChart3,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

type Metrics = {
  totalCommits: number;
  totalLocAdded: number;
  totalLocDeleted: number;
  flags: {
    hasCommitsBeforeT0: boolean;
    hasBulkCommits: boolean;
    hasLargeInitialCommitAfterT0: boolean;
    hasMergeCommits: boolean;
  };
};

type Submission = {
  teamId: number;
  teamName: string;
  projectId: string;
  projectName: string;
  githubUrl: string;
  demoUrl: string | null;
  description: string | null;
  metrics: Metrics | null;
};

type FilterMode = "all" | "flagged" | "clean" | "unscanned";

function FlagCell({ on }: { on: boolean }) {
  return on ? (
    <span className="inline-flex rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
      Yes
    </span>
  ) : (
    <span className="inline-flex rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300/80">
      No
    </span>
  );
}

function hasAnyFlag(m: Metrics | null): boolean {
  if (!m) return false;
  return (
    m.flags.hasCommitsBeforeT0 ||
    m.flags.hasBulkCommits ||
    m.flags.hasLargeInitialCommitAfterT0 ||
    m.flags.hasMergeCommits
  );
}

export default function StaffAnalyzePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [metricsAvailable, setMetricsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "judge" && role !== "mentor" && role !== "super_admin") {
      router.replace("/");
    }
  }, [isPending, session?.user, router]);

  useEffect(() => {
    if (isPending || !session?.user) return;
    let ignore = false;
    setLoading(true);
    fetch("/api/staff/repo-analyzer/submissions", { credentials: "include" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok || !json?.success) {
          throw new Error(json?.error?.message ?? "Failed to load submissions");
        }
        if (ignore) return;
        setSubmissions(json.data.submissions ?? []);
        setMetricsAvailable(Boolean(json.data.metricsAvailable));
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [isPending, session?.user]);

  const filtered = useMemo(() => {
    return submissions.filter((s) => {
      if (filter === "all") return true;
      if (filter === "unscanned") return !s.metrics;
      if (filter === "flagged") return hasAnyFlag(s.metrics);
      return s.metrics != null && !hasAnyFlag(s.metrics);
    });
  }, [submissions, filter]);

  const stats = useMemo(() => {
    const flagged = submissions.filter((s) => hasAnyFlag(s.metrics)).length;
    const scanned = submissions.filter((s) => s.metrics).length;
    const commits = submissions.reduce(
      (sum, s) => sum + (s.metrics?.totalCommits ?? 0),
      0,
    );
    return {
      total: submissions.length,
      flagged,
      clean: scanned - flagged,
      unscanned: submissions.length - scanned,
      commits,
    };
  }, [submissions]);

  if (isPending || !session?.user) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="h-6 w-6 text-[var(--text-muted)] animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Logo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-white">Repo Analyzer</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  Judge submissions via GitHub metrics (HCMC analyzer)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/staff"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Link>
              <a
                href="/api/staff/repo-analyzer/export"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                Export repos.csv
              </a>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { label: "Submissions", value: stats.total },
              { label: "Flagged", value: stats.flagged },
              { label: "Clean", value: stats.clean },
              { label: "Unscanned", value: stats.unscanned },
              { label: "Commits", value: stats.commits },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3"
              >
                <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  {s.label}
                </div>
                <div className="mt-1 text-xl font-bold tabular-nums text-white">
                  {s.value}
                </div>
              </div>
            ))}
          </div>

          {!metricsAvailable && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">No scan results loaded yet</p>
                  <p className="mt-1 text-amber-100/80">
                    Export <code className="text-xs">repos.csv</code>, run{" "}
                    <code className="text-xs">
                      python3 tools/hackathon-analyzer/scan.py --repos … --config
                      tools/hackathon-analyzer/config.json --work-dir
                      tools/hackathon-analyzer/work
                    </code>
                    , then refresh. Metrics merge automatically when{" "}
                    <code className="text-xs">metrics_summary.csv</code> exists.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4 flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["flagged", "Flagged"],
                ["clean", "Clean"],
                ["unscanned", "Unscanned"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === key
                    ? "bg-white/10 text-white"
                    : "text-[var(--text-muted)] hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
              <BarChart3 className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                No submissions match this filter
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--bg-secondary)] text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Team / Project</th>
                    <th className="px-4 py-3 font-medium">Commits</th>
                    <th className="px-4 py-3 font-medium">LOC+</th>
                    <th className="px-4 py-3 font-medium">Pre-T0</th>
                    <th className="px-4 py-3 font-medium">Bulk</th>
                    <th className="px-4 py-3 font-medium">Init</th>
                    <th className="px-4 py-3 font-medium">Merge</th>
                    <th className="px-4 py-3 font-medium">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr
                      key={s.projectId}
                      className="border-t border-[var(--border-color)] bg-[var(--card-bg)]/60 hover:bg-[var(--card-hover-bg)]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{s.teamName}</div>
                        <div className="text-xs text-[var(--accent-cyan)]">
                          {s.projectName}
                        </div>
                        {hasAnyFlag(s.metrics) ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-red-300">
                            <AlertTriangle className="h-3 w-3" /> Flagged
                          </div>
                        ) : s.metrics ? (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-300/80">
                            <CheckCircle2 className="h-3 w-3" /> Clean
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                        {s.metrics?.totalCommits ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[var(--text-secondary)]">
                        {s.metrics?.totalLocAdded ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {s.metrics ? (
                          <FlagCell on={s.metrics.flags.hasCommitsBeforeT0} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.metrics ? (
                          <FlagCell on={s.metrics.flags.hasBulkCommits} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.metrics ? (
                          <FlagCell
                            on={s.metrics.flags.hasLargeInitialCommitAfterT0}
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.metrics ? (
                          <FlagCell on={s.metrics.flags.hasMergeCommits} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={s.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white"
                          >
                            <Github className="h-3.5 w-3.5" />
                            Repo
                          </a>
                          {s.demoUrl ? (
                            <a
                              href={s.demoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)] hover:text-white"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Demo
                            </a>
                          ) : null}
                          <Link
                            href={`/staff/evaluate/${s.teamId}`}
                            className="text-xs font-medium text-[var(--accent-blue)] hover:underline"
                          >
                            Score
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
