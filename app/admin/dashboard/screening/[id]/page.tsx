"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, RotateCcw, X, Video, Loader2, Trash2, ExternalLink, Link as LinkIcon } from "lucide-react";

type TeamDetail = {
  team: {
    id: number;
    name: string;
    description: string | null;
    screeningStatus: string;
    screeningVideoUrl: string | null;
    screeningVideoStoragePath: string | null;
    screeningSubmittedAt: string | null;
    screeningRejectedAt: string | null;
    screeningRejectedReason: string | null;
    screeningApprovedAt: string | null;
  };
  members: Array<{
    userId: string;
    role: string;
    name: string | null;
    email: string;
    answers: Array<{ questionId: number; selectedIndex: number; isCorrect: boolean }>;
  }>;
  questions: Array<{
    id: number;
    title: string;
    options: string[];
    correctIndex: number;
  }>;
};

export default function AdminScreeningTeamPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);
  const [resettingStatus, setResettingStatus] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  const handleApprove = async () => {
    setApproving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "approved" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to approve");
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "rejected", reason: rejectReason.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to reject");
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setRejecting(false);
    }
  };

  const handleSetSubmitted = async () => {
    setSubmittingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "submitted" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to set submitted status");
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set submitted status");
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleSetDraft = async () => {
    setResettingStatus(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "draft" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to reset status");
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset status");
    } finally {
      setResettingStatus(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm("Delete this team's video? This cannot be undone.")) return;
    setDeletingVideo(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/screening/teams/${id}/video`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to delete video");
      await fetchDetail();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete video");
    } finally {
      setDeletingVideo(false);
    }
  };

  if (!id) return null;
  const team = data?.team;
  const videoUrl = team?.screeningVideoUrl ?? team?.screeningVideoStoragePath ?? null;
  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/screening"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </Link>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Team not found.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{team?.name}</h1>
              {team?.description && (
                <p className="mt-1 text-[var(--text-secondary)]">{team.description}</p>
              )}
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Status:{" "}
                {team?.screeningStatus === "submitted"
                  ? "In review"
                  : team?.screeningStatus === "approved"
                    ? "Approved"
                    : team?.screeningStatus === "rejected"
                      ? "Rejected"
                      : "Draft"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSetSubmitted}
                disabled={submittingStatus}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {submittingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Submit for review
              </button>
              <button
                type="button"
                onClick={handleSetDraft}
                disabled={resettingStatus}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
              >
                {resettingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Move to draft
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={approving}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-50"
                >
                  {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Rejection reason (optional)"
                  className="w-56 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejecting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>

          {team?.screeningRejectedReason && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <strong>Rejection reason:</strong> {team.screeningRejectedReason}
            </div>
          )}

          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Video className="h-4 w-4" />
                Demo video
              </h2>
              {videoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  disabled={deletingVideo}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {deletingVideo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Delete video
                </button>
              )}
            </div>
            {videoUrl ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-3">
                  <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    <LinkIcon className="h-3.5 w-3.5" />
                    Video link
                  </p>
                  <a
                    href={videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2 break-all text-sm text-[var(--accent-blue)] hover:underline"
                  >
                    <span>{videoUrl}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" />
                  </a>
                  <p className="mt-2 text-xs text-amber-300/90">
                    The link must be public and not password-protected.
                  </p>
                </div>
                <p className="text-xs text-[var(--text-muted)] break-all">{videoUrl}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">Not uploaded.</p>
            )}
          </section>

          <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
            <h2 className="font-semibold text-white">Members and logic quiz answers</h2>
            <div className="mt-4 space-y-6">
              {data.members.map((member) => (
                <div
                  key={member.userId}
                  className="rounded-lg bg-[var(--bg-secondary)]/50 p-4"
                >
                  <p className="font-medium text-white">
                    {member.name ?? member.email}
                    <span className="ml-2 text-xs text-[var(--text-muted)]">{member.role}</span>
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">{member.email}</p>
                  <div className="mt-3 space-y-2">
                    {data.questions.map((q) => {
                      const ans = member.answers.find((a) => a.questionId === q.id);
                      const opt = ans !== undefined ? (q.options as string[])[ans.selectedIndex] : null;
                      return (
                        <div key={q.id} className="text-sm">
                          <span className="text-[var(--text-muted)]">{q.title}: </span>
                          <span className={ans?.isCorrect ? "text-green-400" : "text-red-400"}>
                            {opt ?? " - "} {ans !== undefined && (ans.isCorrect ? "✓" : "✗")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
