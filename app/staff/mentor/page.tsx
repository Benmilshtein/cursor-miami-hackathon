"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  Loader2,
  LogOut,
  MessageSquare,
  UserCheck,
  UserX,
  Users,
  Zap,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Logo, NoiseOverlay } from "@/components/ui";

type MentorRequestStatus = "pending" | "assigned" | "matched" | "completed" | "cancelled";

type ActiveRequest = {
  id: string;
  teamId: number;
  status: MentorRequestStatus;
  teamName: string | null;
  projectName: string | null;
  projectDescription: string | null;
  projectGithubUrl: string | null;
  projectDemoUrl: string | null;
} | null;

type TeamCard = {
  id: number;
  name: string;
  project: {
    name: string;
    description: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
  } | null;
  mentorRequest: {
    id: string;
    status: MentorRequestStatus;
    hasMentor: boolean;
  } | null;
};

type SSEPayload =
  | { type: "init"; request: ActiveRequest }
  | { type: "assigned"; requestId: string; teamId: number; teamName: string | null };

export default function MentorDashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [activeRequest, setActiveRequest] = useState<ActiveRequest>(null);
  const [requestLoading, setRequestLoading] = useState(true);
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const esRef = useRef<EventSource | null>(null);

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string } | null;

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    if (user?.role !== "mentor") {
      router.replace("/staff");
    }
  }, [isPending, session, user?.role, router]);

  useEffect(() => {
    if (isPending || !session?.user || user?.role !== "mentor") return;

    fetch("/api/staff/mentor-teams", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d?.success) setTeams(d.data as TeamCard[]); })
      .catch(() => {})
      .finally(() => setTeamsLoading(false));
  }, [isPending, session?.user, user?.role]);

  useEffect(() => {
    if (isPending || !session?.user || user?.role !== "mentor") return;

    const es = new EventSource("/api/staff/mentor-notifications/stream");
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as SSEPayload;
        if (payload.type === "init") {
          setActiveRequest(payload.request);
          setRequestLoading(false);
        } else if (payload.type === "assigned") {
          setActiveRequest((prev) =>
            prev
              ? prev
              : {
                  id: payload.requestId,
                  teamId: payload.teamId,
                  status: "assigned",
                  teamName: payload.teamName,
                  projectName: null,
                  projectDescription: null,
                  projectGithubUrl: null,
                  projectDemoUrl: null,
                },
          );
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => setRequestLoading(false);

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [isPending, session?.user, user?.role]);

  async function handleAction(action: "accept" | "decline" | "complete", requestId: string) {
    setError(null);
    setActionLoading(action);
    try {
      const res = await fetch(`/api/staff/mentor-request/${requestId}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");

      if (action === "accept") {
        setActiveRequest((prev) => prev ? { ...prev, status: "matched" } : prev);
      } else if (action === "decline" || action === "complete") {
        setActiveRequest(null);
      }

      if (action === "complete") {
        const refreshed = await fetch("/api/staff/mentor-teams", { credentials: "include" })
          .then((r) => r.json());
        if (refreshed?.success) setTeams(refreshed.data as TeamCard[]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSignOut() {
    setSignOutLoading(true);
    await authClient.signOut();
    router.replace("/staff/login");
  }

  if (isPending || !session?.user) {
    return (
      <>
        <NoiseOverlay />
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
        </div>
      </>
    );
  }

  const requestStatusConfig = activeRequest
    ? {
        assigned: {
          label: "Team is waiting for you",
          color: "border-amber-500/30 bg-amber-500/10",
          dot: "bg-amber-400",
          text: "text-amber-200",
        },
        matched: {
          label: "Session in progress",
          color: "border-blue-500/30 bg-blue-500/10",
          dot: "bg-blue-400",
          text: "text-blue-200",
        },
        pending: null,
        completed: null,
        cancelled: null,
      }[activeRequest.status]
    : null;

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] text-white">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Logo className="h-7 w-auto" />
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Mentor dashboard
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-[var(--text-muted)] sm:block">
                {user?.name ?? user?.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signOutLoading}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                {signOutLoading ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Active session card */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Current status
            </h2>

            {requestLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-muted)]">Loading…</span>
              </div>
            ) : !activeRequest || !requestStatusConfig ? (
              <div className="flex items-center gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-200">You are available</p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    Wait for requests from teams. You will be notified automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-xl border px-5 py-4 ${requestStatusConfig.color}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${requestStatusConfig.dot}`}
                    />
                    <div>
                      <p className={`font-semibold ${requestStatusConfig.text}`}>
                        {requestStatusConfig.label}
                      </p>
                      <p className="mt-0.5 text-sm text-white">
                        Team:{" "}
                        <span className="font-medium">
                          {activeRequest.teamName ?? `#${activeRequest.teamId}`}
                        </span>
                      </p>
                      {activeRequest.projectName && (
                        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                          Project: {activeRequest.projectName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {activeRequest.status === "assigned" && (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => void handleAction("accept", activeRequest.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          <UserCheck className="h-4 w-4" />
                          {actionLoading === "accept" ? "Accepting…" : "Accept"}
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading !== null}
                          onClick={() => void handleAction("decline", activeRequest.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <UserX className="h-4 w-4" />
                          {actionLoading === "decline" ? "Declining…" : "Decline"}
                        </button>
                      </>
                    )}
                    {activeRequest.status === "matched" && (
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={() => void handleAction("complete", activeRequest.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-200 hover:bg-blue-500/30 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {actionLoading === "complete" ? "Ending…" : "End session"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Teams grid */}
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Teams and projects
            </h2>

            {teamsLoading ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--text-muted)]" />
              </div>
            ) : teams.length === 0 ? (
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-sm text-[var(--text-muted)]">
                No approved teams yet.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((t) => (
                  <TeamCardItem key={t.id} team={t} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

function TeamCardItem({ team }: { team: TeamCard }) {
  const req = team.mentorRequest;

  const badge = req
    ? req.status === "matched"
      ? { label: "Mentor assigned", cls: "border-blue-500/30 bg-blue-500/10 text-blue-300" }
      : req.status === "assigned"
        ? { label: "Awaiting response", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" }
        : { label: "Waiting for mentor", cls: "border-amber-500/30 bg-amber-500/10 text-amber-300" }
    : null;

  return (
    <div className="flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 transition-[border-color] hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <p className="font-semibold text-white">{team.name}</p>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${badge.cls}`}
          >
            {badge.label}
          </span>
        )}
      </div>

      {team.project ? (
        <div className="mt-3 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            <FolderGit2 className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            <p className="text-sm font-medium text-white">{team.project.name}</p>
          </div>
          {team.project.description && (
            <p className="line-clamp-2 text-xs text-[var(--text-secondary)]">
              {team.project.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 pt-1">
            {team.project.githubUrl && (
              <Link
                href={team.project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            )}
            {team.project.demoUrl && (
              <Link
                href={team.project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-white"
              >
                <Globe className="h-3.5 w-3.5" />
                Demo
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[var(--text-muted)]">No project added</p>
      )}
    </div>
  );
}
