"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FolderGit2,
  Github,
} from "lucide-react";
import { SpotlightCard } from "@/components/ui";
import { useLanguage } from "@/lib/LanguageContext";

const COPY = {
  en: {
    eyebrow: "PROJECT",
    title: "Submission",
    notSubmitted: "You haven't submitted your project yet.",
    submittedLine: "Project submitted",
    deadlineLine: "Deadline",
    deadlinePassed: "Submission deadline has passed",
    cta: "Open submission portal",
    ctaEdit: "View / Edit submission",
  },
  de: {
    eyebrow: "PROJECT",
    title: "Submission",
    notSubmitted: "You haven't submitted your project yet.",
    submittedLine: "Project submitted",
    deadlineLine: "Deadline",
    deadlinePassed: "Submission deadline has passed",
    cta: "Open submission portal",
    ctaEdit: "View / Edit submission",
  },
  es: {
    eyebrow: "PROJECT",
    title: "Submission",
    notSubmitted: "You haven't submitted your project yet.",
    submittedLine: "Project submitted",
    deadlineLine: "Deadline",
    deadlinePassed: "Submission deadline has passed",
    cta: "Open submission portal",
    ctaEdit: "View / Edit submission",
  },
} as const;

type ProjectSummary = {
  id: string;
  name: string;
  githubUrl: string;
  updatedAt: string;
};

type Props = {
  teamApproved: boolean;
};

export function ProjectStatusCard({ teamApproved }: Props) {
  const { language } = useLanguage();
  const copy = COPY[language];
  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/projects/my", { credentials: "include" });
        const json = await res.json();
        if (ignore) return;
        if (json.success && json.data) {
          const p = json.data.project as ProjectSummary | null;
          setProject(p);
          setDeadline(json.data.deadline ?? null);
        }
      } catch {
        /* silent — fail open, dashboard still loads */
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, []);

  if (!teamApproved) return null;

  const deadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;
  // A row created solely to hold an app URL has a blank github_url — that's not
  // a full project submission, so don't show the "submitted" state for it.
  const hasSubmission = Boolean(project && project.githubUrl?.trim());

  return (
    <section id="project" className="mt-10 scroll-mt-28">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {copy.title}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-6">
          <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/5" />
        </div>
      ) : hasSubmission && project ? (
        <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(16, 214, 194,0.12)">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-emerald-300">
                  {copy.submittedLine}
                </p>
                <p className="mt-0.5 truncate text-base font-semibold text-white">
                  {project.name}
                </p>
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-white"
                >
                  <Github size={12} />
                  <span className="truncate">{project.githubUrl}</span>
                </a>
              </div>
            </div>
            <Link
              href="/dashboard/submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-tertiary)]"
            >
              {copy.ctaEdit}
              <ArrowRight size={14} />
            </Link>
          </div>
        </SpotlightCard>
      ) : (
        <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(255, 45, 146,0.14)">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                <FolderGit2 size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold text-white">
                  {copy.notSubmitted}
                </p>
                {deadline && (
                  <p
                    className={`mt-1 inline-flex items-center gap-1.5 text-xs ${
                      deadlinePassed ? "text-red-300" : "text-[var(--text-secondary)]"
                    }`}
                  >
                    <Clock size={12} />
                    {deadlinePassed
                      ? copy.deadlinePassed
                      : `${copy.deadlineLine}: ${new Date(deadline).toLocaleString()}`}
                  </p>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/submit"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-blue)]/90"
            >
              {copy.cta}
              <ArrowRight size={14} />
            </Link>
          </div>
        </SpotlightCard>
      )}
    </section>
  );
}
