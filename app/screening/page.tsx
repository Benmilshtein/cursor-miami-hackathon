"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Video, Send, AlertCircle, Loader2, Users, ExternalLink, Link as LinkIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { NoiseOverlay } from "@/components/ui";
import { useLanguage } from "@/lib/LanguageContext";

type Question = {
  id: number;
  title: string;
  description: string | null;
  options: string[];
  sortOrder: number;
};

type TeamStatus = {
  teamId: number | null;
  status: string | null;
  videoUrl: string | null;
  videoStorageUrl: string | null;
  canSubmit: boolean;
  hasVideo: boolean;
  allMembersCompletedLogic: boolean;
  memberCount: number;
  requiredAnswerCount: number;
  canManageTeamVideo: boolean;
  submittedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
};

const SCREENING_COPY = {
  en: {
    loading: "Loading…",
    redirecting: "Redirecting to dashboard…",
    title: "Screening Tasks",
    subtitle:
      "Answer the questions and add your team demo video link (YouTube or Google Drive). After submission, your application goes to review.",
    loadError: "Failed to load data.",
    saveAnswerError: "Failed to save answer.",
    saveVideoError: "Failed to save video.",
    submitError: "Failed to submit.",
    logicTitle: "Logic tasks ({count} of 5)",
    logicDesc: "Each team member must answer all questions.",
    noQuestions: "Questions are not published yet. Please wait or contact organizers.",
    videoTitle: "Team Demo Video",
    videoTopic: "Video topic: «What is an ideal product?»",
    videoDesc:
      "One video per team, up to 2 minutes. Paste a YouTube or Google Drive link.",
    videoPublicHint: "The video link must be public and accessible without a password.",
    videoPlaceholder: "Paste a YouTube or Google Drive link",
    currentVideo: "Current video:",
    videoLinkLabel: "Video link",
    saving: "Saving…",
    noTeam: "Create or join a team to add a demo video.",
    leadOnlyVideo: "Only the team lead can set and edit the team demo video link.",
    rejectedLabel: "Application rejected.",
    rejectedReasonLabel: "Reason",
    rejectedHint: "Fix the issues and resubmit.",
    submittedInfo: "Application is under review. Wait for the super admin decision.",
    approvedInfo: "Application approved. Editing answers and video is disabled.",
    teamProgress:
      "Team members: {members}. Logic: {logic}. Video: {video}.",
    allAnswered: "everyone answered",
    notAllAnswered: "not everyone answered",
    videoAdded: "added",
    videoMissing: "missing",
    submitAction: "Submit for review",
    submittingAction: "Submitting…",
    openVideo: "Open video",
  },
  de: {
    loading: "Loading…",
    redirecting: "Redirecting to dashboard…",
    title: "Screening Tasks",
    subtitle:
      "Answer the questions and add your team demo video link (YouTube or Google Drive). After submission, your application goes to review.",
    loadError: "Failed to load data.",
    saveAnswerError: "Failed to save answer.",
    saveVideoError: "Failed to save video.",
    submitError: "Failed to submit.",
    logicTitle: "Logic tasks ({count} of 5)",
    logicDesc: "Each team member must answer all questions.",
    noQuestions: "Questions are not published yet. Please wait or contact organizers.",
    videoTitle: "Team Demo Video",
    videoTopic: "Video topic: «What is an ideal product?»",
    videoDesc:
      "One video per team, up to 2 minutes. Paste a YouTube or Google Drive link.",
    videoPublicHint: "The video link must be public and accessible without a password.",
    videoPlaceholder: "Paste a YouTube or Google Drive link",
    currentVideo: "Current video:",
    videoLinkLabel: "Video link",
    saving: "Saving…",
    noTeam: "Create or join a team to add a demo video.",
    leadOnlyVideo: "Only the team lead can set and edit the team demo video link.",
    rejectedLabel: "Application rejected.",
    rejectedReasonLabel: "Reason",
    rejectedHint: "Fix the issues and resubmit.",
    submittedInfo: "Application is under review. Wait for the super admin decision.",
    approvedInfo: "Application approved. Editing answers and video is disabled.",
    teamProgress:
      "Team members: {members}. Logic: {logic}. Video: {video}.",
    allAnswered: "everyone answered",
    notAllAnswered: "not everyone answered",
    videoAdded: "added",
    videoMissing: "missing",
    submitAction: "Submit for review",
    submittingAction: "Submitting…",
    openVideo: "Open video",
  },
  es: {
    loading: "Loading…",
    redirecting: "Redirecting to dashboard…",
    title: "Screening Tasks",
    subtitle:
      "Answer the questions and add your team demo video link (YouTube or Google Drive). After submission, your application goes to review.",
    loadError: "Failed to load data.",
    saveAnswerError: "Failed to save answer.",
    saveVideoError: "Failed to save video.",
    submitError: "Failed to submit.",
    logicTitle: "Logic tasks ({count} of 5)",
    logicDesc: "Each team member must answer all questions.",
    noQuestions: "Questions are not published yet. Please wait or contact organizers.",
    videoTitle: "Team Demo Video",
    videoTopic: "Video topic: «What is an ideal product?»",
    videoDesc:
      "One video per team, up to 2 minutes. Paste a YouTube or Google Drive link.",
    videoPublicHint: "The video link must be public and accessible without a password.",
    videoPlaceholder: "Paste a YouTube or Google Drive link",
    currentVideo: "Current video:",
    videoLinkLabel: "Video link",
    saving: "Saving…",
    noTeam: "Create or join a team to add a demo video.",
    leadOnlyVideo: "Only the team lead can set and edit the team demo video link.",
    rejectedLabel: "Application rejected.",
    rejectedReasonLabel: "Reason",
    rejectedHint: "Fix the issues and resubmit.",
    submittedInfo: "Application is under review. Wait for the super admin decision.",
    approvedInfo: "Application approved. Editing answers and video is disabled.",
    teamProgress:
      "Team members: {members}. Logic: {logic}. Video: {video}.",
    allAnswered: "everyone answered",
    notAllAnswered: "not everyone answered",
    videoAdded: "added",
    videoMissing: "missing",
    submitAction: "Submit for review",
    submittingAction: "Submitting…",
    openVideo: "Open video",
  },
} as const;

export default function ScreeningPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const copy = SCREENING_COPY[language];
  const { data: session, isPending } = authClient.useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [teamStatus, setTeamStatus] = useState<TeamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAnswer, setSavingAnswer] = useState<number | null>(null);
  const [savingVideo, setSavingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [screeningPhase, setScreeningPhase] = useState<string | null>(null);
  const status = teamStatus?.status ?? "draft";
  const canSubmit = teamStatus?.canSubmit ?? false;
  const isSubmitted = status === "submitted";
  const isRejected = status === "rejected";
  const isApproved = status === "approved";
  const isScreeningActive = screeningPhase === "screening_active";
  const isReadOnly = isSubmitted || isApproved || !isScreeningActive;
  const canManageTeamVideo = teamStatus?.canManageTeamVideo ?? false;
  const isVideoReadOnly = isReadOnly || !canManageTeamVideo;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qRes, aRes, tRes, phaseRes] = await Promise.all([
        fetch("/api/screening/questions", { credentials: "include" }),
        fetch("/api/screening/answers", { credentials: "include" }),
        fetch("/api/screening/team-status", { credentials: "include" }),
        fetch("/api/screening/phase", { credentials: "include" }),
      ]);
      if (!qRes.ok || !aRes.ok || !tRes.ok) throw new Error("Failed to load");
      const qData = await qRes.json();
      const aData = await aRes.json();
      const tData = await tRes.json();
      const phaseData = await phaseRes.json().catch(() => null);
      if (qData.success) setQuestions(qData.data.questions ?? []);
      if (aData.success) {
        const map: Record<number, number> = {};
        for (const a of aData.data.answers ?? []) {
          map[a.questionId] = a.selectedIndex;
        }
        setAnswers(map);
      }
      if (tData.success) {
        setTeamStatus(tData.data);
        setVideoInput(tData.data.videoUrl ?? tData.data.videoStorageUrl ?? "");
      }
      if (phaseData?.success) {
        setScreeningPhase(phaseData.data.phase);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.loadError);
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    if (!session?.user) {
      router.replace("/register");
      return;
    }
    void fetchData();
  }, [session?.user, router, fetchData]);

  const saveAnswer = async (questionId: number, selectedIndex: number) => {
    if (isReadOnly) return;
    setSavingAnswer(questionId);
    setError(null);
    try {
      const res = await fetch("/api/screening/answers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questionId, selectedIndex }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to save");
      setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.saveAnswerError);
    } finally {
      setSavingAnswer(null);
    }
  };

  const saveVideo = async () => {
    if (isVideoReadOnly) return;
    if (!teamStatus?.teamId) return;
    setSavingVideo(true);
    setError(null);
    try {
      const res = await fetch("/api/screening/team-video", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoUrl: videoInput.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to save video");
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.saveVideoError);
    } finally {
      setSavingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/screening/submit", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to submit");
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.submitError);
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending || !session?.user) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{copy.loading}</div>
        </div>
      </>
    );
  }

  if (screeningPhase !== null && screeningPhase !== "screening_active") {
    router.replace("/dashboard");
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-muted)]">{copy.redirecting}</div>
      </div>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{copy.title}</h1>
            <p className="mt-1 text-[var(--text-secondary)]">
              {copy.subtitle}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-blue)]" />
            </div>
          ) : (
            <>
              {/* Logic questions */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6"
              >
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {copy.logicTitle.replace("{count}", String(questions.length))}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {copy.logicDesc}
                </p>
                <ul className="mt-6 space-y-6">
                  {questions.map((q) => (
                    <li key={q.id} className="rounded-lg bg-[var(--bg-secondary)]/50 p-4">
                      <p className="font-medium text-white">{q.title}</p>
                      {q.description && (
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{q.description}</p>
                      )}
                      <div className="mt-3 space-y-2">
                        {(q.options as string[]).map((opt, idx) => (
                          <label
                            key={idx}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2 transition-colors ${
                              answers[q.id] === idx
                                ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
                                : "border-[var(--border-color)] hover:bg-white/5"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === idx}
                              onChange={() => saveAnswer(q.id, idx)}
                              disabled={savingAnswer === q.id || isReadOnly}
                              className="text-[var(--accent-blue)]"
                            />
                            <span className="text-[var(--text-secondary)]">{opt}</span>
                            {savingAnswer === q.id && (
                              <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-blue)]" />
                            )}
                          </label>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
                {questions.length === 0 && (
                  <p className="py-4 text-sm text-[var(--text-muted)]">
                    {copy.noQuestions}
                  </p>
                )}
              </motion.section>

              {/* Team video */}
              <motion.section
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6"
              >
                <h2 className="font-semibold text-white flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  {copy.videoTitle}
                </h2>
                <p className="mt-2 text-sm font-medium text-white/95">{copy.videoTopic}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {copy.videoDesc}
                </p>
                <p className="mt-1 text-xs text-amber-300/90">
                  {copy.videoPublicHint}
                </p>
                {teamStatus?.teamId ? (
                  <div className="mt-4 space-y-4">
                    <input
                      type="url"
                      value={videoInput}
                      onChange={(e) => setVideoInput(e.target.value)}
                      onBlur={saveVideo}
                      placeholder={copy.videoPlaceholder}
                      disabled={isVideoReadOnly}
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none disabled:opacity-60"
                    />
                    {!isReadOnly && !canManageTeamVideo && (
                      <p className="text-sm text-[var(--text-muted)]">
                        {copy.leadOnlyVideo}
                      </p>
                    )}
                    {(teamStatus.videoUrl || teamStatus.videoStorageUrl) && (
                      <div className="rounded-lg bg-[var(--bg-secondary)]/50 p-3">
                        <p className="text-xs text-[var(--text-muted)] mb-1">{copy.currentVideo}</p>
                        {(() => {
                          const savedUrl = teamStatus.videoStorageUrl ?? teamStatus.videoUrl;
                          if (!savedUrl) return null;
                          if (savedUrl.startsWith("http")) {
                            return (
                              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/40 p-3">
                                <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  {copy.videoLinkLabel}
                                </p>
                                <a
                                  href={savedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-2 break-all text-sm text-[var(--accent-blue)] hover:underline"
                                >
                                  <span>{savedUrl}</span>
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
                                </a>
                              </div>
                            );
                          }
                          return <span className="text-sm text-[var(--text-secondary)]">{savedUrl}</span>;
                        })()}
                      </div>
                    )}
                    {savingVideo && (
                      <p className="text-sm text-[var(--accent-blue)]">{copy.saving}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--text-muted)]">
                    {copy.noTeam}
                  </p>
                )}
              </motion.section>

              {/* Status & Submit */}
              {isRejected && teamStatus?.rejectedReason && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <strong>{copy.rejectedLabel}</strong> {copy.rejectedReasonLabel}: {teamStatus.rejectedReason}. {copy.rejectedHint}
                </div>
              )}

              {isSubmitted && (
                <div className="rounded-xl border border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {copy.submittedInfo}
                </div>
              )}
              {isApproved && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {copy.approvedInfo}
                </div>
              )}

              {(status === "draft" || isRejected) && (
                <div className="flex flex-wrap items-center gap-4">
                  {teamStatus && (
                    <p className="text-sm text-[var(--text-muted)]">
                      <Users className="inline h-4 w-4 mr-1" />
                      {copy.teamProgress
                        .replace("{members}", String(teamStatus.memberCount))
                        .replace(
                          "{logic}",
                          teamStatus.allMembersCompletedLogic ? copy.allAnswered : copy.notAllAnswered,
                        )
                        .replace("{video}", teamStatus.hasVideo ? copy.videoAdded : copy.videoMissing)}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting || isReadOnly}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? copy.submittingAction : copy.submitAction}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
