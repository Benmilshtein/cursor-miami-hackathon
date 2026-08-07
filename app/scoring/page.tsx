"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Ban,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Github,
  Globe,
  Loader2,
  Lock,
  Play,
  Presentation,
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";
import { RequirementBadges } from "@/components/judging/RepoFileViewer";
import {
  MiamiScorePanel,
  type MiamiAverages,
  type MiamiScoreRow,
  type MiamiSubmittedScore,
} from "@/components/judging/MiamiScorePanel";

type BoardMember = { name: string | null; email: string; isLead: boolean };

type BoardTeam = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  screeningStatus: string;
  isFinalist: boolean;
  members: BoardMember[];
  project: {
    name: string;
    description: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    prdUrl: string | null;
    techStack: string | null;
    slidesUrl: string | null;
    videoUrl: string | null;
  } | null;
  appUrl: string | null;
  prdUrl: string | null;
  repoCheck: {
    hasPrd: boolean;
    hasCursorRules: boolean;
    hasAppUrl: boolean;
    onTime: boolean;
  } | null;
  hasPrd: boolean;
  disqualified: { reason: string; byName: string | null; at: string } | null;
  myScore: MiamiSubmittedScore | null;
  scoresVisible: boolean;
  scores: MiamiScoreRow[];
  averages: MiamiAverages | null;
  submittedCount: number;
};

type ResultRow = {
  rank: number;
  teamId: number;
  avgProblemIdentification: number;
  avgProductMaturity: number;
  avgSolutionViability: number;
  avgTotal: number;
  judgeCount: number;
};

type Progress = {
  activeJudgeCount: number;
  scorableTeams: number;
  completeTeams: number;
  disqualifiedTeams: number;
  allComplete: boolean;
};

function LinkChip({
  href,
  icon,
  label,
  accent = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
        accent
          ? "border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20"
          : "border-[var(--border-color)] text-white hover:bg-white/5"
      }`}
    >
      {icon} {label}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </a>
  );
}

function DisqualifyControl({
  team,
  onChanged,
}: {
  team: BoardTeam;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (disqualified: boolean, reasonText?: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/scoring-system/disqualify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: team.id, disqualified, reason: reasonText }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to update disqualification");
      }
      setOpen(false);
      setReason("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update disqualification");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-500/25 bg-red-500/[0.04] p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={!!team.disqualified}
          disabled={saving}
          onChange={(e) => {
            if (e.target.checked) {
              setOpen(true);
            } else if (
              window.confirm(`Remove disqualification for “${team.name}”?`)
            ) {
              void post(false);
            }
          }}
        />
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Ban className="h-3.5 w-3.5 text-red-400" />
          Disqualified
        </span>
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
          Super admin only
        </span>
      </label>

      {team.disqualified && (
        <p className="mt-2 text-xs text-red-200/90">
          <span className="font-medium">Reason:</span> {team.disqualified.reason}
          <span className="ml-2 text-[var(--text-muted)]">
            {team.disqualified.byName ? `by ${team.disqualified.byName} · ` : ""}
            {new Date(team.disqualified.at).toLocaleString()}
          </span>
        </p>
      )}

      {open && !team.disqualified && (
        <div className="mt-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Reason for disqualification (required)…"
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-red-400 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving || !reason.trim()}
              onClick={() => void post(true, reason)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
              Confirm disqualification
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setOpen(false);
                setReason("");
                setError(null);
              }}
              className="rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}

function StandingsTable({
  results,
  teamById,
  disqualified,
}: {
  results: ResultRow[];
  teamById: Map<number, BoardTeam>;
  disqualified: BoardTeam[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="py-1.5 pr-3 font-medium">#</th>
            <th className="py-1.5 pr-3 font-medium">Team</th>
            <th className="py-1.5 pr-3 font-medium" title="Problem Identification">Problem</th>
            <th className="py-1.5 pr-3 font-medium" title="Product Maturity">Maturity</th>
            <th className="py-1.5 pr-3 font-medium" title="Solution Viability">Viability</th>
            <th className="py-1.5 pr-3 font-medium">Total</th>
            <th className="py-1.5 font-medium">Judges</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const team = teamById.get(r.teamId);
            return (
              <tr
                key={r.teamId}
                className={`border-t border-[var(--border-color)]/50 ${
                  r.rank <= 3 ? "text-white" : "text-[var(--text-secondary)]"
                }`}
              >
                <td className="py-1.5 pr-3 font-semibold tabular-nums">
                  {r.rank <= 3 ? (
                    <span
                      className={
                        r.rank === 1
                          ? "text-amber-400"
                          : r.rank === 2
                            ? "text-slate-300"
                            : "text-orange-400"
                      }
                    >
                      {r.rank}
                    </span>
                  ) : (
                    r.rank
                  )}
                </td>
                <td className="py-1.5 pr-3">
                  <span className="font-medium text-white">{team?.name ?? `Team ${r.teamId}`}</span>
                  {team && team.members.length > 0 && (
                    <span className="ml-2 text-[var(--text-muted)]">
                      {team.members.map((m) => m.name ?? m.email).join(", ")}
                    </span>
                  )}
                </td>
                <td className="py-1.5 pr-3 tabular-nums">{r.avgProblemIdentification}</td>
                <td className="py-1.5 pr-3 tabular-nums">{r.avgProductMaturity}</td>
                <td className="py-1.5 pr-3 tabular-nums">{r.avgSolutionViability}</td>
                <td className="py-1.5 pr-3 font-semibold tabular-nums text-white">
                  {r.avgTotal} / 30
                </td>
                <td className="py-1.5 tabular-nums">{r.judgeCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {disqualified.length > 0 && (
        <div className="mt-3 border-t border-red-500/20 pt-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400">
            Disqualified (excluded from results)
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-red-200/80">
            {disqualified.map((t) => (
              <li key={t.id}>
                <span className="font-medium text-red-200">{t.name}</span>
                {t.disqualified?.reason ? ` - ${t.disqualified.reason}` : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function WinnersSection({
  progress,
  results,
  teamById,
  teams,
  isAdmin,
}: {
  progress: Progress;
  results: ResultRow[] | null;
  teamById: Map<number, BoardTeam>;
  teams: BoardTeam[];
  isAdmin: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const disqualified = teams.filter((t) => t.disqualified);
  const progressLine = `${progress.completeTeams} / ${progress.scorableTeams} teams fully scored · ${progress.activeJudgeCount} judge${progress.activeJudgeCount === 1 ? "" : "s"} active${progress.disqualifiedTeams ? ` · ${progress.disqualifiedTeams} disqualified` : ""}`;

  // Judges see nothing rankable until every team is done - the reveal moment.
  if (!progress.allComplete) {
    return (
      <div className="mb-6 rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Lock className="h-4 w-4 text-[var(--text-muted)]" />
            Winners are announced here automatically once every team is scored by every active
            judge or disqualified.
          </p>
          {isAdmin && results && (
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
            >
              {previewOpen ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {previewOpen ? "Hide live standings" : "Preview live standings"}
            </button>
          )}
        </div>
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[var(--accent-blue)] transition-all"
              style={{
                width: `${progress.scorableTeams ? Math.round((progress.completeTeams / progress.scorableTeams) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-[var(--text-muted)]">{progressLine}</p>
        </div>
        {isAdmin && results && previewOpen && (
          <div className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
              Super admin preview - not final, hidden from judges
            </p>
            <StandingsTable results={results} teamById={teamById} disqualified={disqualified} />
          </div>
        )}
      </div>
    );
  }

  if (!results || results.length === 0) return null;
  const podium = results.slice(0, 3);

  return (
    <div className="mb-6 rounded-xl border border-amber-500/40 bg-gradient-to-b from-amber-500/[0.08] to-transparent p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white">Final results - winners</h2>
        <span className="text-xs text-[var(--text-muted)]">{progressLine}</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {podium.map((r) => {
          const team = teamById.get(r.teamId);
          const rankStyles =
            r.rank === 1
              ? "border-amber-500/50 bg-amber-500/10 text-amber-300"
              : r.rank === 2
                ? "border-slate-400/40 bg-slate-400/10 text-slate-200"
                : "border-orange-500/40 bg-orange-500/10 text-orange-300";
          return (
            <div key={r.teamId} className={`rounded-xl border p-4 ${rankStyles}`}>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {r.rank === 1 ? "1st place" : r.rank === 2 ? "2nd place" : "3rd place"}
                </span>
              </div>
              <p className="mt-2 text-base font-bold text-white">
                {team?.name ?? `Team ${r.teamId}`}
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {r.avgTotal}
                <span className="text-sm font-normal text-[var(--text-muted)]"> / 30</span>
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                Problem {r.avgProblemIdentification} · Maturity {r.avgProductMaturity} · Viability{" "}
                {r.avgSolutionViability} · {r.judgeCount} judge{r.judgeCount === 1 ? "" : "s"}
              </p>
              {team && team.members.length > 0 && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {team.members.map((m) => m.name ?? m.email).join(", ")}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {team?.appUrl && (
                  <LinkChip href={team.appUrl} icon={<Globe className="h-3 w-3" />} label="App" accent />
                )}
                {team?.project?.githubUrl && (
                  <LinkChip href={team.project.githubUrl} icon={<Github className="h-3 w-3" />} label="Repo" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
        <StandingsTable results={results} teamById={teamById} disqualified={disqualified} />
      </div>
    </div>
  );
}

export default function MiamiScoringSystemPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [teams, setTeams] = useState<BoardTeam[]>([]);
  const [role, setRole] = useState<"judge" | "super_admin" | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [missingPrdOnly, setMissingPrdOnly] = useState(false);

  const sessionRole = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    if (sessionRole !== "judge" && sessionRole !== "super_admin") {
      router.replace("/");
    }
  }, [isPending, session?.user, sessionRole, router]);

  const load = useCallback(() => {
    fetch("/api/scoring-system", { credentials: "include" })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok || !json.success) {
          throw new Error(json?.error?.message ?? "Failed to load scoring board");
        }
        setTeams(json.data.teams as BoardTeam[]);
        setRole(json.data.role);
        setProgress((json.data.progress as Progress) ?? null);
        setResults((json.data.results as ResultRow[] | null) ?? null);
        setLoadError(null);
      })
      .catch((e) => {
        setLoadError(e instanceof Error ? e.message : "Failed to load scoring board");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isPending || !session?.user) return;
    if (sessionRole !== "judge" && sessionRole !== "super_admin") return;
    load();
  }, [isPending, session?.user, sessionRole, load]);

  const isAdmin = role === "super_admin";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      if (missingPrdOnly && t.hasPrd) return false;
      if (!q) return true;
      const haystack = [
        t.name,
        t.project?.name,
        ...t.members.map((m) => `${m.name ?? ""} ${m.email}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [teams, search, missingPrdOnly]);

  const missingPrdCount = teams.filter((t) => !t.hasPrd).length;
  const disqualifiedCount = teams.filter((t) => t.disqualified).length;
  const myScoredCount = teams.filter((t) => t.myScore).length;
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t] as const)), [teams]);

  if (isPending || !session?.user || (sessionRole !== "judge" && sessionRole !== "super_admin")) {
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
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Logo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-white">Miami Scoring System</h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isAdmin ? "Super admin view - all judge scores" : "Judge view - score every team once"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  load();
                }}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
              <Link
                href={isAdmin ? "/admin/dashboard" : "/staff"}
                className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white"
              >
                {isAdmin ? "Admin dashboard" : "Judge dashboard"}
              </Link>
            </div>
          </div>

          {/* Winners announcement / reveal progress */}
          {!loading && progress && (
            <WinnersSection
              progress={progress}
              results={results}
              teamById={teamById}
              teams={teams}
              isAdmin={isAdmin}
            />
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
              <div className="mb-1 text-xs text-[var(--text-muted)]">Teams</div>
              <div className="text-2xl font-bold tabular-nums text-white">{teams.length}</div>
            </div>
            {!isAdmin && (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 text-xs text-[var(--text-muted)]">Scored by you</div>
                <div className="text-2xl font-bold tabular-nums text-white">
                  {myScoredCount}
                  <span className="text-sm font-normal text-[var(--text-muted)]"> / {teams.length}</span>
                </div>
              </div>
            )}
            {isAdmin && (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <div className="mb-1 text-xs text-[var(--text-muted)]">Score submissions</div>
                <div className="text-2xl font-bold tabular-nums text-white">
                  {teams.reduce((sum, t) => sum + t.scores.length, 0)}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
              <div className="mb-1 text-xs text-[var(--text-muted)]">Missing PRD</div>
              <div className={`text-2xl font-bold tabular-nums ${missingPrdCount ? "text-amber-400" : "text-white"}`}>
                {missingPrdCount}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
              <div className="mb-1 text-xs text-[var(--text-muted)]">Disqualified</div>
              <div className={`text-2xl font-bold tabular-nums ${disqualifiedCount ? "text-red-400" : "text-white"}`}>
                {disqualifiedCount}
              </div>
            </div>
          </div>

          {/* Search + filters */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team, member, email, project…"
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] py-2 pl-9 pr-3 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
              <input
                type="checkbox"
                checked={missingPrdOnly}
                onChange={(e) => setMissingPrdOnly(e.target.checked)}
              />
              Missing PRD only
            </label>
          </div>

          {loadError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {loadError}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 text-center text-sm text-[var(--text-secondary)]">
              No teams match.
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl border p-4 md:p-5 ${
                    t.disqualified
                      ? "border-red-500/40 bg-red-500/[0.03]"
                      : t.isFinalist
                        ? "border-amber-500/40 bg-amber-500/[0.04]"
                        : "border-[var(--border-color)] bg-[var(--card-bg)]"
                  }`}
                >
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-white">{t.name}</h2>
                    {t.isFinalist && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                        <Trophy className="h-2.5 w-2.5" /> Finalist
                      </span>
                    )}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        t.screeningStatus === "approved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/10 text-[var(--text-secondary)]"
                      }`}
                    >
                      {t.screeningStatus}
                    </span>
                    {!t.hasPrd && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                        <AlertTriangle className="h-2.5 w-2.5" /> No PRD
                      </span>
                    )}
                    {t.disqualified && (
                      <span className="inline-flex items-center gap-1 rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                        <ShieldAlert className="h-2.5 w-2.5" /> Disqualified
                      </span>
                    )}
                    {progress && progress.activeJudgeCount > 0 && !t.disqualified && (
                      <span
                        className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                          t.submittedCount >= progress.activeJudgeCount
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-white/10 text-[var(--text-secondary)]"
                        }`}
                        title="Judges who have submitted for this team"
                      >
                        {t.submittedCount}/{progress.activeJudgeCount} judges
                      </span>
                    )}
                  </div>

                  {/* Members */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)]">
                    <Users className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    {t.members.length === 0 ? (
                      <span className="text-[var(--text-muted)]">No active members</span>
                    ) : (
                      t.members.map((m) => (
                        <span key={m.email} className="inline-flex items-center gap-1">
                          <span className="text-white">{m.name ?? m.email}</span>
                          {m.isLead && (
                            <span className="rounded bg-[var(--accent-blue)]/15 px-1 text-[9px] font-semibold uppercase text-[var(--accent-blue)]">
                              Lead
                            </span>
                          )}
                          <span className="text-[var(--text-muted)]">({m.email})</span>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Project info */}
                  {t.project ? (
                    <div className="mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--accent-blue)]">{t.project.name}</span>
                      {t.project.techStack && (
                        <span className="text-[var(--text-muted)]"> · {t.project.techStack}</span>
                      )}
                      {t.project.description && (
                        <p className="mt-1 line-clamp-2 text-[var(--text-muted)]">
                          {t.project.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs italic text-amber-400/80">No project submitted yet</p>
                  )}

                  {/* Repo requirement badges */}
                  <div className="mt-3">
                    <RequirementBadges check={t.repoCheck} />
                  </div>

                  {/* Links */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {t.appUrl && (
                      <LinkChip href={t.appUrl} icon={<Globe className="h-3.5 w-3.5" />} label="Live app" accent />
                    )}
                    {(t.prdUrl || t.project?.prdUrl) && (
                      <LinkChip
                        href={(t.prdUrl || t.project?.prdUrl)!}
                        icon={<FileText className="h-3.5 w-3.5" />}
                        label="PRD"
                      />
                    )}
                    {t.project?.githubUrl && (
                      <LinkChip href={t.project.githubUrl} icon={<Github className="h-3.5 w-3.5" />} label="Repo" />
                    )}
                    {t.project?.slidesUrl && (
                      <LinkChip
                        href={t.project.slidesUrl}
                        icon={<Presentation className="h-3.5 w-3.5" />}
                        label="Slides"
                      />
                    )}
                    {t.project?.videoUrl && (
                      <LinkChip href={t.project.videoUrl} icon={<Play className="h-3.5 w-3.5" />} label="Video" />
                    )}
                    {!t.appUrl && !t.project?.githubUrl && (
                      <span className="text-xs text-[var(--text-muted)]">No links submitted yet</span>
                    )}
                  </div>

                  {/* Scoring */}
                  <div className="mt-4 space-y-3">
                    <MiamiScorePanel
                      teamId={t.id}
                      teamName={t.name}
                      isAdmin={isAdmin}
                      myScore={t.myScore}
                      scoresVisible={t.scoresVisible}
                      scores={t.scores}
                      averages={t.averages}
                      onSubmitted={() => load()}
                    />
                    {isAdmin && <DisqualifyControl team={t} onChanged={() => load()} />}
                    {!isAdmin && t.disqualified && (
                      <p className="rounded-lg border border-red-500/25 bg-red-500/[0.04] px-3 py-2 text-xs text-red-200/90">
                        <span className="font-medium">Disqualified:</span> {t.disqualified.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
