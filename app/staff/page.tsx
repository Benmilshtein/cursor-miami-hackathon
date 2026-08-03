"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Trophy,
  Check,
  Mic,
  X,
  ChevronRight,
  BarChart3,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  Layers,
  Loader2,
  Play,
  Presentation,
  Users,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

type TeamProject = {
  name: string;
  description: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  techStack: string | null;
  slidesUrl: string | null;
  videoUrl: string | null;
};

type RepoCheck = {
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  onTime: boolean;
};

type TeamToEvaluate = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  approved: boolean;
  /** Step 3: on stage for the finals pitch. */
  isFinalist: boolean;
  /** Whether this judge has already scored that pitch. */
  pitchScored: boolean;
  /** Deployed app URL, live all night. */
  appUrl: string | null;
  project: TeamProject | null;
  repoCheck: RepoCheck | null;
  scored: boolean;
  total: number | null;
};

/**
 * Step 1 at a glance: PRD / .cursorrules / public URL. Amber means present but
 * outside the first hour, or never checked. This is a flag only - scoring is
 * never blocked by it.
 */
function RequirementBadges({ check }: { check: RepoCheck | null }) {
  if (!check) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        Repo not checked
      </span>
    );
  }

  const items: Array<[string, boolean]> = [
    ["PRD", check.hasPrd],
    [".cursorrules", check.hasCursorRules],
    ["URL", check.hasAppUrl],
  ];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map(([label, present]) => (
        <span
          key={label}
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            present
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {present ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
          {label}
        </span>
      ))}
      {!check.onTime && (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
          <AlertTriangle className="h-2.5 w-2.5" />
          Late
        </span>
      )}
    </div>
  );
}

export default function StaffDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [teams, setTeams] = useState<TeamToEvaluate[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    const user = session.user as { role?: string };
    if (user.role !== "judge" && user.role !== "mentor") {
      router.replace("/");
      return;
    }
    if (user.role === "mentor") {
      router.replace("/staff/mentor");
      return;
    }
  }, [isPending, session?.user, router]);

  const userRole = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (isPending || !session?.user) return;
    if (userRole !== "judge") return;
    let ignore = false;

    fetch("/api/staff/teams-to-evaluate", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (ignore || !data?.success) return;
        setTeams(data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setTeamsLoading(false);
      });

    return () => { ignore = true; };
  }, [isPending, session?.user, userRole]);

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

  const user = session.user as { name?: string; email?: string; role?: string };
  const isJudge = user.role === "judge";
  const scoredCount = teams.filter((t) => t.scored).length;
  // Denominator is what can actually be scored, not every team being watched.
  const scorableCount = teams.filter((t) => t.project && t.approved).length;
  const finalists = teams.filter((t) => t.isFinalist);
  // During the finals, put the teams on stage first - otherwise a judge scrolls
  // past the whole field to find the six that are pitching.
  const orderedTeams = finalists.length
    ? [...finalists, ...teams.filter((t) => !t.isFinalist)]
    : teams;

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Logo size={40} />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {isJudge ? "Judge dashboard" : "Mentor dashboard"}
                </h1>
                <p className="text-[var(--text-secondary)] text-sm">
                  {user.name ?? user.email}
                </p>
              </div>
            </div>
            <Link
              href="/ranking"
              className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition-colors"
            >
              <Trophy className="h-3.5 w-3.5" />
              Ranking
            </Link>
          </div>

          {isJudge && (
            <>
              {/* Stats */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Scored</div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {scoredCount} <span className="text-sm font-normal text-[var(--text-muted)]">/ {scorableCount}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                  <div className="text-xs text-[var(--text-muted)] mb-1">Remaining</div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {Math.max(0, scorableCount - scoredCount)}
                  </div>
                </div>
              </div>

              {/* Teams list */}
              <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                Teams building
              </h2>
              {teamsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 text-[var(--text-muted)] animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center">
                  <BarChart3 className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-[var(--text-secondary)] text-sm">No active teams yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orderedTeams.map((team, idx) => {
                    // Scoring needs an approved team with a submitted project;
                    // watching the live build needs neither.
                    const canScore = !!team.project && team.approved;

                    return (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`rounded-xl border p-4 ${
                          team.isFinalist
                            ? "border-amber-500/40 bg-amber-500/[0.04]"
                            : "border-[var(--border-color)] bg-[var(--card-bg)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                            team.scored ? "bg-emerald-500/10" : "bg-white/5"
                          }`}>
                            {team.scored ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <span className="text-xs font-bold text-[var(--text-muted)]">{idx + 1}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-white truncate">{team.name}</span>
                              {team.isFinalist && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                                  <Trophy className="h-2.5 w-2.5" />
                                  Finalist
                                </span>
                              )}
                            </div>
                            {team.project ? (
                              <div className="text-xs text-[var(--accent-blue)] truncate">
                                {team.project.name}
                              </div>
                            ) : (
                              <div className="text-xs text-amber-400/80">No project submitted</div>
                            )}
                            <div className="text-xs text-[var(--text-muted)]">
                              {team.memberCount}{" "}
                              {team.memberCount === 1 ? "member" : "members"}
                              {team.scored && team.total !== null && (
                                <span className="ml-2 text-emerald-400">{team.total} / 100</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 ml-11">
                          <RequirementBadges check={team.repoCheck} />
                        </div>

                        <div className="mt-3 ml-11 flex flex-wrap items-center gap-2">
                          {team.appUrl ? (
                            <a
                              href={team.appUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/10 px-2.5 py-1.5 text-xs font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20"
                            >
                              <Globe className="h-3.5 w-3.5" /> Open live app
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">No app URL yet</span>
                          )}
                          {team.project?.githubUrl ? (
                            <a
                              href={team.project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5"
                            >
                              <Github className="h-3.5 w-3.5" /> Repo
                            </a>
                          ) : null}
                          {team.isFinalist && (
                            <Link
                              href={`/staff/evaluate/${team.id}#pitch`}
                              className={`ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                team.pitchScored
                                  ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-amber-500 text-black hover:bg-amber-400"
                              }`}
                            >
                              {team.pitchScored ? <Check className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                              {team.pitchScored ? "Pitch scored" : "Score pitch"}
                            </Link>
                          )}
                          {canScore ? (
                            <Link
                              href={`/staff/evaluate/${team.id}`}
                              className={`inline-flex items-center gap-1 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs font-medium text-white hover:border-[var(--border-hover)] hover:bg-white/5 ${
                                team.isFinalist ? "" : "ml-auto"
                              }`}
                            >
                              {team.scored ? "Edit score" : "Score"}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : (
                            <span className={`text-xs text-[var(--text-muted)] ${team.isFinalist ? "" : "ml-auto"}`}>
                              Not scorable yet
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!isJudge && (
            <>
              <h2 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">
                Teams and projects
              </h2>
              {teamsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 text-[var(--text-muted)] animate-spin" />
                </div>
              ) : teams.length === 0 ? (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
                  <p className="text-[var(--text-secondary)] text-sm">No approved teams</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((t, idx) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 flex-shrink-0">
                          <Users className="h-4 w-4 text-[var(--text-muted)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm truncate">{t.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {t.memberCount} {t.memberCount === 1 ? "member" : "members"}
                          </div>
                        </div>
                      </div>

                      {t.project ? (
                        <div className="ml-11">
                          <div className="flex items-start gap-2 mb-2">
                            <FolderGit2 className="h-3.5 w-3.5 mt-0.5 text-[var(--accent-blue)] flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--accent-blue)] truncate">{t.project.name}</p>
                              {t.project.description && (
                                <p className="mt-0.5 text-xs text-[var(--text-secondary)] line-clamp-2">{t.project.description}</p>
                              )}
                            </div>
                          </div>
                          {t.project.techStack && (
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-[var(--text-muted)]">
                              <Layers className="h-3 w-3" />
                              {t.project.techStack}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {t.project.githubUrl && (
                              <a href={t.project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5">
                                <Github className="h-3.5 w-3.5" /> GitHub <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                              </a>
                            )}
                            {t.project.demoUrl && (
                              <a href={t.project.demoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5">
                                <Globe className="h-3.5 w-3.5" /> Demo <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                              </a>
                            )}
                            {t.project.slidesUrl && (
                              <a href={t.project.slidesUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5">
                                <Presentation className="h-3.5 w-3.5" /> Slides <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                              </a>
                            )}
                            {t.project.videoUrl && (
                              <a href={t.project.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5">
                                <Play className="h-3.5 w-3.5" /> Video <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="ml-11 text-xs text-[var(--text-muted)] italic">Project not submitted yet</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
