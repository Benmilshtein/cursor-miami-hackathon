"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Cpu,
  BarChart3,
  Palette,
  Briefcase,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  Layers,
  Loader2,
  Lock,
  Play,
  Presentation,
} from "lucide-react";
import Link from "next/link";
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

const CRITERIA = [
  { key: "innovation" as const, label: "Innovation", subtitle: "Originality of idea, creative approach", max: 25, weight: "25%", icon: Sparkles, color: "var(--accent-purple)" },
  { key: "technicalExecution" as const, label: "Technical execution", subtitle: "Code quality, architecture, technologies", max: 25, weight: "25%", icon: Cpu, color: "var(--accent-blue)" },
  { key: "aiUsage" as const, label: "AI usage", subtitle: "AI/ML integration, Cursor effectiveness", max: 20, weight: "20%", icon: BarChart3, color: "var(--accent-cyan)" },
  { key: "uxUi" as const, label: "UX/UI", subtitle: "Ease of use, interface quality", max: 15, weight: "15%", icon: Palette, color: "var(--accent-green)" },
  { key: "businessPotential" as const, label: "Business potential", subtitle: "Market potential, scalability", max: 15, weight: "15%", icon: Briefcase, color: "var(--accent-amber)" },
] as const;

type Scores = {
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
};

function ScoreSlider({
  value,
  max,
  color,
  onChange,
}: {
  value: number;
  max: number;
  color: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-white/10"
        style={{
          accentColor: color,
        }}
      />
      <span className="w-14 text-right text-sm font-bold tabular-nums text-white">
        {value} / {max}
      </span>
    </div>
  );
}

export default function EvaluateTeamPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId: teamIdStr } = use(params);
  const teamId = Number(teamIdStr);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [scores, setScores] = useState<Scores>({
    innovation: 0,
    technicalExecution: 0,
    aiUsage: 0,
    uxUi: 0,
    businessPotential: 0,
  });
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamProject, setTeamProject] = useState<TeamProject | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [rankingFinalized, setRankingFinalized] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    const user = session.user as { role?: string };
    if (user.role !== "judge") {
      router.replace("/staff");
      return;
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (isPending || !session?.user) return;
    let ignore = false;

    async function load() {
      try {
        const [scoreRes, teamsRes, rankingRes] = await Promise.all([
          fetch(`/api/staff/evaluate/${teamId}`, { credentials: "include" }),
          fetch("/api/staff/teams-to-evaluate", { credentials: "include" }),
          fetch("/api/ranking", { credentials: "include" }),
        ]);
        if (ignore) return;

        const scoreData = await scoreRes.json();
        if (scoreData?.success && scoreData.data) {
          const s = scoreData.data;
          setScores({
            innovation: s.innovation ?? 0,
            technicalExecution: s.technicalExecution ?? 0,
            aiUsage: s.aiUsage ?? 0,
            uxUi: s.uxUi ?? 0,
            businessPotential: s.businessPotential ?? 0,
          });
          setComment(s.comment ?? "");
          setIsEdit(true);
        }

        const teamsData = await teamsRes.json();
        if (teamsData?.success && Array.isArray(teamsData.data)) {
          const t = teamsData.data.find((x: { id: number }) => x.id === teamId);
          if (t) {
            setTeamName(t.name);
            if (t.project) setTeamProject(t.project);
          }
        }

        const rankingData = await rankingRes.json();
        if (rankingData?.success && typeof rankingData.data?.finalized === "boolean") {
          setRankingFinalized(rankingData.data.finalized);
        }
      } catch {
        setError("Failed to load data");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [isPending, session, teamId]);

  const total = scores.innovation + scores.technicalExecution + scores.aiUsage + scores.uxUi + scores.businessPotential;

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/staff/evaluate/${teamId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...scores, comment: comment || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to save");
      setSaved(true);
      setIsEdit(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (isPending || loading) {
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
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <Link href="/staff" className="rounded-lg border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:text-white hover:border-[var(--border-hover)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-3">
              <Logo size={32} />
              <div>
                <h1 className="text-xl font-bold text-white">
                  {teamName ? `Score: ${teamName}` : "Team score"}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {isEdit ? "Edit score" : "New score"}
                </p>
              </div>
            </div>
          </div>

          {/* Project details */}
          {teamProject && (
            <div className="mb-6 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10">
                  <FolderGit2 className="h-4 w-4 text-[var(--accent-blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-white">{teamProject.name}</h3>
                  {teamProject.description && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {teamProject.description}
                    </p>
                  )}
                </div>
              </div>
              {teamProject.techStack && (
                <div className="flex items-center gap-2 mb-3 text-xs text-[var(--text-secondary)]">
                  <Layers className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  {teamProject.techStack}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {teamProject.githubUrl && (
                  <a
                    href={teamProject.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5"
                  >
                    <Github className="h-3.5 w-3.5" />
                    GitHub
                    <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                  </a>
                )}
                {teamProject.demoUrl && (
                  <a
                    href={teamProject.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Demo
                    <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                  </a>
                )}
                {teamProject.slidesUrl && (
                  <a
                    href={teamProject.slidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5"
                  >
                    <Presentation className="h-3.5 w-3.5" />
                    Slides
                    <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                  </a>
                )}
                {teamProject.videoUrl && (
                  <a
                    href={teamProject.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-2.5 py-1.5 text-xs text-white hover:bg-white/5"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Video
                    <ExternalLink className="h-3 w-3 text-[var(--text-muted)]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Criteria sliders */}
          <div className="space-y-4">
            {CRITERIA.map((c) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:p-5"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${c.color} 15%, transparent)` }}>
                      <Icon className="h-4.5 w-4.5" style={{ color: c.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white text-sm">{c.label}</span>
                        <span className="text-xs text-[var(--text-muted)]">{c.weight}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.subtitle}</p>
                    </div>
                  </div>
                  <ScoreSlider
                    value={scores[c.key]}
                    max={c.max}
                    color={c.color}
                    onChange={(v) => setScores((prev) => ({ ...prev, [c.key]: v }))}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Comment */}
          <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 md:p-5">
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Comment (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Notes about the team presentation…"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none resize-none"
            />
          </div>

          {/* Finalized banner */}
          {rankingFinalized && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <Lock className="h-4 w-4 shrink-0 text-amber-400" />
              Ranking is finalized. Scores can no longer be changed.
            </div>
          )}

          {/* Total + Submit */}
          <div className="mt-6 flex items-center justify-between">
            <div>
              <span className="text-sm text-[var(--text-muted)]">Total:</span>
              <span className="ml-2 text-3xl font-bold tabular-nums text-white">{total}</span>
              <span className="text-sm text-[var(--text-muted)]"> / 100</span>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || rankingFinalized}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : saved ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved
                </>
              ) : rankingFinalized ? (
                <>
                  <Lock className="h-4 w-4" />
                  Finalized
                </>
              ) : (
                isEdit ? "Update score" : "Submit score"
              )}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}
        </div>
      </div>
    </>
  );
}
