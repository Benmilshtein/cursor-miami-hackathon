"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Compass,
  Copy,
  Crown,
  FolderGit2,
  Gift,
  Globe,
  DoorOpen,
  Home,
  Mail,
  MessageSquare,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  UserRound,
  Vote,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProjectStatusCard } from "@/components/dashboard/ProjectStatusCard";
import { PartnerCreditsPanel } from "@/components/participant/PartnerCreditsPanel";
import PeerVotingSection from "@/components/participant/PeerVotingSection";
import AppUrlSection from "@/components/participant/AppUrlSection";
import { Button, NoiseOverlay, SpotlightCard } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const DASHBOARD_COPY = {
  en: {
    loading: "Loading your dashboard...",
    welcomeGreeting: "Hi,",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    sectionVote: "Vote",
    sectionAppUrl: "App URL",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    teamLabel: "Team",
    screeningLabel: "Screening",
    readinessLabel: "Readiness",
    screeningDraft: "Draft",
    screeningSubmitted: "Under review",
    screeningApproved: "Approved",
    screeningRejected: "Rejected",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    createTeamTitle: "Create a team",
    joinTeamTitle: "Join with a code",
    createTeamDesc: "Create the team core and get an invite code for the rest of the members.",
    joinTeamDesc: "If your captain already created the team, enter the invite code and take an open slot.",
    teamNameLabel: "Team name",
    teamDescriptionLabel: "Short description",
    teamCodeLabel: "Invite code",
    createTeamAction: "Create team",
    creatingTeamAction: "Creating...",
    joinTeamAction: "Join team",
    joiningTeamAction: "Joining...",
    copyCode: "Copy code",
    copiedCode: "Code copied",
    rotateCode: "Rotate code",
    rotatingCode: "Rotating...",
    leaveTeam: "Leave team",
    leavingTeam: "Leaving team...",
    captainBadge: "Captain",
    memberBadge: "Member",
    noTeamState:
      "You are not in a team yet. To move through the main selection flow, create a team or join an existing one.",
    inviteNote: "The invite block reflects the team's current working join code.",
    teamDescriptionFallback: "No team description yet.",
    accountTitle: "Account",
    accountName: "Name",
    accountEmail: "Email",
    accountRole: "Role",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    requestFailed: "Request failed.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
    bannerRegistration: "Registration and team formation are in progress. Screening has not started yet.",
    bannerScreeningActive: "Screening is active! Complete the tasks to confirm your team's participation.",
    bannerScreeningCompleted: "Screening is complete. Results are published below.",
    bannerGoToScreening: "Go to screening",
    bannerScreeningNotStarted: "Screening not started yet",
    resultApproved: "Your team passed the screening! Welcome to the finals.",
    resultRejected: "Unfortunately, your team did not pass the screening.",
    resultPending: "Screening results have not been announced yet.",
    resultNoTeam: "Create a team to participate in the screening.",
    createTeamNamePlaceholder: "Cursor Core",
    createTeamDescriptionPlaceholder: "Focus: AI product, workflow, or infra",
    joinCodePlaceholder: "7AB4K9XZ",
  },
  // Dashboard uses English strings for de/es until dedicated translations are added.
  de: {
    loading: "Loading your dashboard...",
    welcomeGreeting: "Hi,",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    sectionVote: "Vote",
    sectionAppUrl: "App URL",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    teamLabel: "Team",
    screeningLabel: "Screening",
    readinessLabel: "Readiness",
    screeningDraft: "Draft",
    screeningSubmitted: "Under review",
    screeningApproved: "Approved",
    screeningRejected: "Rejected",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    createTeamTitle: "Create a team",
    joinTeamTitle: "Join with a code",
    createTeamDesc: "Create the team core and get an invite code for the rest of the members.",
    joinTeamDesc: "If your captain already created the team, enter the invite code and take an open slot.",
    teamNameLabel: "Team name",
    teamDescriptionLabel: "Short description",
    teamCodeLabel: "Invite code",
    createTeamAction: "Create team",
    creatingTeamAction: "Creating...",
    joinTeamAction: "Join team",
    joiningTeamAction: "Joining...",
    copyCode: "Copy code",
    copiedCode: "Code copied",
    rotateCode: "Rotate code",
    rotatingCode: "Rotating...",
    leaveTeam: "Leave team",
    leavingTeam: "Leaving team...",
    captainBadge: "Captain",
    memberBadge: "Member",
    noTeamState:
      "You are not in a team yet. To move through the main selection flow, create a team or join an existing one.",
    inviteNote: "The invite block reflects the team's current working join code.",
    teamDescriptionFallback: "No team description yet.",
    accountTitle: "Account",
    accountName: "Name",
    accountEmail: "Email",
    accountRole: "Role",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    requestFailed: "Request failed.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
    bannerRegistration: "Registration and team formation are in progress. Screening has not started yet.",
    bannerScreeningActive: "Screening is active! Complete the tasks to confirm your team's participation.",
    bannerScreeningCompleted: "Screening is complete. Results are published below.",
    bannerGoToScreening: "Go to screening",
    bannerScreeningNotStarted: "Screening not started yet",
    resultApproved: "Your team passed the screening! Welcome to the finals.",
    resultRejected: "Unfortunately, your team did not pass the screening.",
    resultPending: "Screening results have not been announced yet.",
    resultNoTeam: "Create a team to participate in the screening.",
    createTeamNamePlaceholder: "Cursor Core",
    createTeamDescriptionPlaceholder: "Focus: AI product, workflow, or infra",
    joinCodePlaceholder: "7AB4K9XZ",
  },
  es: {
    loading: "Loading your dashboard...",
    welcomeGreeting: "Hi,",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    sectionVote: "Vote",
    sectionAppUrl: "App URL",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    teamLabel: "Team",
    screeningLabel: "Screening",
    readinessLabel: "Readiness",
    screeningDraft: "Draft",
    screeningSubmitted: "Under review",
    screeningApproved: "Approved",
    screeningRejected: "Rejected",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    createTeamTitle: "Create a team",
    joinTeamTitle: "Join with a code",
    createTeamDesc: "Create the team core and get an invite code for the rest of the members.",
    joinTeamDesc: "If your captain already created the team, enter the invite code and take an open slot.",
    teamNameLabel: "Team name",
    teamDescriptionLabel: "Short description",
    teamCodeLabel: "Invite code",
    createTeamAction: "Create team",
    creatingTeamAction: "Creating...",
    joinTeamAction: "Join team",
    joiningTeamAction: "Joining...",
    copyCode: "Copy code",
    copiedCode: "Code copied",
    rotateCode: "Rotate code",
    rotatingCode: "Rotating...",
    leaveTeam: "Leave team",
    leavingTeam: "Leaving team...",
    captainBadge: "Captain",
    memberBadge: "Member",
    noTeamState:
      "You are not in a team yet. To move through the main selection flow, create a team or join an existing one.",
    inviteNote: "The invite block reflects the team's current working join code.",
    teamDescriptionFallback: "No team description yet.",
    accountTitle: "Account",
    accountName: "Name",
    accountEmail: "Email",
    accountRole: "Role",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    requestFailed: "Request failed.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
    bannerRegistration: "Registration and team formation are in progress. Screening has not started yet.",
    bannerScreeningActive: "Screening is active! Complete the tasks to confirm your team's participation.",
    bannerScreeningCompleted: "Screening is complete. Results are published below.",
    bannerGoToScreening: "Go to screening",
    bannerScreeningNotStarted: "Screening not started yet",
    resultApproved: "Your team passed the screening! Welcome to the finals.",
    resultRejected: "Unfortunately, your team did not pass the screening.",
    resultPending: "Screening results have not been announced yet.",
    resultNoTeam: "Create a team to participate in the screening.",
    createTeamNamePlaceholder: "Cursor Core",
    createTeamDescriptionPlaceholder: "Focus: AI product, workflow, or infra",
    joinCodePlaceholder: "7AB4K9XZ",
  },
} as const;

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  teamId?: number | null;
  isTeamLead?: boolean;
  role?: string | null;
  twoFactorEnabled?: boolean | null;
};

type TeamInvite = {
  code: string;
  isExpired: boolean;
};

type TeamMember = {
  userId: string;
  role: "lead" | "member";
  joinedAt: string;
  name: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isTeamLead: boolean;
};

type TeamData = {
  id: number;
  name: string;
  description?: string | null;
  status: "active" | "archived";
  screeningStatus?: "draft" | "submitted" | "approved" | "rejected";
  memberCount: number;
  maxMembers: number;
  joinCode: string;
  invite: TeamInvite | null;
  members: TeamMember[];
  captainUserId: string | null;
  currentUserMembership: {
    role: "lead" | "member";
  } | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
};

type DashboardCopy = (typeof DASHBOARD_COPY)[keyof typeof DASHBOARD_COPY];

async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? "Request failed.");
  }

  return payload.data as T;
}

function formatRole(user: SessionUser | null, team: TeamData | null, copy: DashboardCopy) {
  if (user?.role === "super_admin") {
    return copy.roleSuperAdmin;
  }

  if (user?.role === "moderator") {
    return copy.roleModerator;
  }

  if (user?.role === "reviewer") {
    return copy.roleReviewer;
  }

  if (team?.currentUserMembership?.role === "lead" || user?.isTeamLead) {
    return copy.roleLead;
  }

  return copy.roleParticipant;
}

export default function DashboardPage() {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
  const [screeningPhase, setScreeningPhase] = useState<string>("registration");
  const [pageError, setPageError] = useState<string | null>(null);
  const [teamActionError, setTeamActionError] = useState<string | null>(null);
  const [teamActionNotice, setTeamActionNotice] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeAction, setActiveAction] = useState<
    null | "create" | "join" | "leave" | "rotate"
  >(null);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  // Show the Vote nav item / card only once the expo is underway.
  const [peerVotingActive, setPeerVotingActive] = useState(false);

  type MentorRequestStatus = "pending" | "assigned" | "matched" | "completed" | "cancelled";
  type MentorRequestState = {
    id: string;
    status: MentorRequestStatus;
    mentorName?: string | null;
  } | null;

  const [mentorRequest, setMentorRequest] = useState<MentorRequestState>(null);
  const [mentorRequestLoading, setMentorRequestLoading] = useState(false);
  const [mentorRequestActionLoading, setMentorRequestActionLoading] = useState(false);
  const mentorEsRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/register");
    }
  }, [isPending, router, session]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/peer-voting/state", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (!ignore && json?.success) {
          // Show once the expo is live OR the team has been split into a group.
          setPeerVotingActive(json.data.phase !== "closed" || json.data.myGroup != null);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!teamActionNotice) return;
    const t = setTimeout(() => setTeamActionNotice(null), 4000);
    return () => clearTimeout(t);
  }, [teamActionNotice]);

  useEffect(() => {
    let ignore = false;

    async function loadTeamState() {
      if (!session?.user) {
        return;
      }

      setIsTeamLoading(true);
      setPageError(null);

      try {
        const [nextTeam, phaseRes] = await Promise.all([
          requestApi<TeamData | null>("/api/teams/current"),
          fetch("/api/screening/phase", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => (d?.success ? d.data.phase : "registration"))
            .catch(() => "registration"),
        ]);

        if (!ignore) {
          setTeam(nextTeam);
          setScreeningPhase(phaseRes as string);
        }
      } catch (error) {
        if (!ignore) {
          setPageError(error instanceof Error ? error.message : copy.loadError);
        }
      } finally {
        if (!ignore) {
          setIsTeamLoading(false);
        }
      }
    }

    if (!isPending && session?.user) {
      void loadTeamState();
    }

    return () => {
      ignore = true;
    };
  }, [copy.loadError, isPending, session]);

  useEffect(() => {
    if (isPending || !session?.user) return;

    const teamId = (session.user as { teamId?: number | null }).teamId;
    if (!teamId) return;

    const es = new EventSource("/api/mentor-request/stream");
    mentorEsRef.current = es;

    type SsePayload =
      | { type: "init"; request: { id: string; status: string } | null }
      | { type: "matched"; requestId: string; mentorName: string | null }
      | { type: "pending" | "cancelled" | "completed"; requestId: string };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string) as SsePayload;
        if (payload.type === "init") {
          const req = payload.request;
          if (req) {
            setMentorRequest({ id: req.id, status: req.status as MentorRequestStatus });
          }
        } else if (payload.type === "matched") {
          setMentorRequest((prev) =>
            prev ? { ...prev, status: "matched", mentorName: payload.mentorName } : prev,
          );
        } else if (payload.type === "pending") {
          setMentorRequest((prev) =>
            prev ? { ...prev, status: "pending" } : prev,
          );
        } else if (payload.type === "cancelled" || payload.type === "completed") {
          setMentorRequest(null);
        }
      } catch { /* ignore */ }
    };

    return () => {
      es.close();
      mentorEsRef.current = null;
    };
  }, [isPending, session]);

  const user = (session?.user ?? null) as SessionUser | null;

  const initials = user?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const filledProfileFields = [
    Boolean(user?.name),
    Boolean(user?.firstName),
    Boolean(user?.lastName),
    Boolean(user?.emailVerified),
    Boolean(team),
  ].filter(Boolean).length;

  const profileCompletion = (filledProfileFields / 5) * 100;
  const teamOccupancy = team ? (team.memberCount / team.maxMembers) * 100 : 0;
  const teamReadiness = team
    ? Math.round(
        ((team.memberCount / team.maxMembers) * 45 +
          (team.invite && !team.invite.isExpired ? 30 : 0) +
          (team.captainUserId ? 25 : 0)),
      )
    : 0;
  const inviteState = team?.invite
    ? team.invite.isExpired
      ? copy.inviteExpired
      : copy.inviteActive
    : copy.inviteMissing;
  const roleLabel = formatRole(user, team, copy);
  const readinessScore = team
    ? Math.round((profileCompletion + teamReadiness) / 2)
    : Math.round(profileCompletion * 0.75);
  const displayName = user?.firstName || user?.name?.split(" ")[0] || "";
  const screeningDisplay = (() => {
    switch (team?.screeningStatus) {
      case "approved": return { label: copy.screeningApproved, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" };
      case "submitted": return { label: copy.screeningSubmitted, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" };
      case "rejected": return { label: copy.screeningRejected, color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" };
      default: return { label: copy.screeningDraft, color: "text-[var(--text-muted)]", bg: "bg-white/5 border-white/10" };
    }
  })();

  async function refreshTeamState(notice?: string) {
    setTeamActionError(null);
    setPageError(null);

    try {
      const nextTeam = await requestApi<TeamData | null>("/api/teams/current");
      setTeam(nextTeam);

      if (notice) {
        setTeamActionNotice(notice);
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : copy.loadError);
    }
  }

  async function handleCreateTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveAction("create");
    setTeamActionError(null);
    setTeamActionNotice(null);

    try {
      await requestApi<TeamData>("/api/teams/create", {
        method: "POST",
        body: JSON.stringify({
          name: createName,
          description: createDescription || null,
        }),
      });

      setCreateName("");
      setCreateDescription("");
      await refreshTeamState(copy.createSuccess);
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleJoinTeam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActiveAction("join");
    setTeamActionError(null);
    setTeamActionNotice(null);

    try {
      await requestApi<TeamData>("/api/teams/join", {
        method: "POST",
        body: JSON.stringify({
          code: joinCode.trim().toUpperCase(),
        }),
      });

      setJoinCode("");
      await refreshTeamState(copy.joinSuccess);
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleRotateInvite() {
    setActiveAction("rotate");
    setTeamActionError(null);
    setTeamActionNotice(null);

    try {
      await requestApi<TeamData>("/api/teams/current", {
        method: "PATCH",
        body: JSON.stringify({
          regenerateInvite: true,
        }),
      });

      await refreshTeamState(copy.rotateSuccess);
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleLeaveTeam() {
    if (!window.confirm(copy.leaveTeam)) {
      return;
    }

    setActiveAction("leave");
    setTeamActionError(null);
    setTeamActionNotice(null);

    try {
      await requestApi<{ leftTeamId: number; archived: boolean }>("/api/teams/leave", {
        method: "POST",
      });

      await refreshTeamState(copy.leaveSuccess);
    } catch (error) {
      setTeamActionError(error instanceof Error ? error.message : copy.loadError);
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCopyInvite() {
    if (!team?.invite?.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(team.invite.code);
      setTeamActionNotice(copy.copiedCode);
    } catch {
      setTeamActionError(team.invite.code);
    }
  }

  async function handleRequestMentor() {
    setMentorRequestLoading(true);
    try {
      const res = await fetch("/api/mentor-request", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? "Request failed");
      const req = json?.data?.request as { id: string; status: string } | undefined;
      if (req) setMentorRequest({ id: req.id, status: req.status as MentorRequestStatus });
    } catch (e) {
      setTeamActionError(e instanceof Error ? e.message : "Error");
    } finally {
      setMentorRequestLoading(false);
    }
  }

  async function handleCancelMentorRequest() {
    setMentorRequestActionLoading(true);
    try {
      const res = await fetch("/api/mentor-request", {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error?.message ?? "Cancel failed");
      }
      setMentorRequest(null);
    } catch (e) {
      setTeamActionError(e instanceof Error ? e.message : "Error");
    } finally {
      setMentorRequestActionLoading(false);
    }
  }

  async function handleSignOut() {
    setPageError(null);
    setIsSigningOut(true);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        throw new Error(error.message || copy.signOutError);
      }

      startTransition(() => {
        router.replace("/register");
        router.refresh();
      });
    } catch (error) {
      setIsSigningOut(false);
      setPageError(error instanceof Error ? error.message : copy.signOutError);
    }
  }

  if (isPending || !session || !user) {
    return (
      <>
        <NoiseOverlay />
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{copy.loading}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <DashboardLayout
        sidebar={
          <div className="h-full">
            <DashboardSidebar
              userName={user.name ?? "User"}
              userEmail={user.email ?? "—"}
              initials={initials || "U"}
              roleLabel={roleLabel}
              teamLabel={copy.teamLabel}
              teamValue={team ? team.name : copy.noTeam}
              navItems={[
                { href: "#overview", label: copy.sectionOverview, icon: Compass },
                { href: "#team", label: copy.sectionTeam, icon: Users },
                ...(peerVotingActive
                  ? [{ href: "#vote", label: copy.sectionVote, icon: Vote }]
                  : []),
                ...(team ? [{ href: "#app-url", label: copy.sectionAppUrl, icon: Globe }] : []),
                { href: "#credits", label: copy.sectionCredits, icon: Gift },
                ...(team?.screeningStatus === "approved"
                  ? [{ href: "/dashboard/submit", label: copy.sectionProject, icon: FolderGit2 }]
                  : []),
                { href: "#account", label: copy.sectionAccount, icon: Shield },
              ]}
              signOutLabel={isSigningOut ? copy.signingOut : copy.signOut}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
              collapseLabel={copy.collapseSidebar}
              expandLabel={copy.expandSidebar}
            />
          </div>
        }
      >
        {/* Welcome header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              {copy.welcomeGreeting}{displayName ? ` ${displayName}` : ""}!
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              {team ? (
                <>
                  <span className="font-medium text-white">{team.name}</span>
                  <span className="text-[var(--text-muted)]">&middot;</span>
                  <span>{roleLabel}</span>
                </>
              ) : (
                <span>{copy.noTeam}</span>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <LanguageSwitcher />
            <Link
              href="/ranking"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-tertiary)]"
            >
              <Trophy size={16} className="text-amber-400" />
              {copy.ranking}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)]"
            >
              <Home size={16} />
              {copy.home}
            </Link>
          </div>
        </header>

        {(pageError || teamActionError || teamActionNotice) && (
          <div className="mt-6 space-y-2">
            {pageError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                {pageError}
              </div>
            )}
            {teamActionError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
                {teamActionError}
              </div>
            )}
            {teamActionNotice && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                {teamActionNotice}
              </div>
            )}
          </div>
        )}

        {/* Screening phase banner */}
        {(() => {
          const isActive = screeningPhase === "screening_active";
          const isCompleted = screeningPhase === "screening_completed";
          if (isCompleted && team) {
            const approved = team.screeningStatus === "approved";
            const rejected = team.screeningStatus === "rejected";
            return (
              <div className={`mt-6 flex items-start gap-4 rounded-xl border px-5 py-4 ${
                approved
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : rejected
                    ? "border-red-500/30 bg-red-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
              }`}>
                {approved ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                ) : rejected ? (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                ) : (
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    approved ? "text-emerald-100" : rejected ? "text-red-100" : "text-amber-100"
                  }`}>
                    {approved ? copy.resultApproved : rejected ? copy.resultRejected : copy.resultPending}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {copy.bannerScreeningCompleted}
                  </p>
                </div>
              </div>
            );
          }

          if (isCompleted && !team) {
            return (
              <div className="mt-6 flex items-start gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-5 py-4">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                <p className="text-sm text-[var(--text-secondary)]">{copy.resultNoTeam}</p>
              </div>
            );
          }

          return (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <ClipboardList className={`mt-0.5 h-5 w-5 shrink-0 ${
                  isActive ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]"
                }`} />
                <p className="text-sm text-[var(--text-secondary)]">
                  {isActive ? copy.bannerScreeningActive : copy.bannerRegistration}
                </p>
              </div>
              {isActive ? (
                <Link
                  href="/screening"
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90"
                >
                  <ArrowRight size={16} />
                  {copy.bannerGoToScreening}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-muted)] opacity-50 cursor-not-allowed"
                >
                  <Clock size={16} />
                  {copy.bannerScreeningNotStarted}
                </button>
              )}
            </div>
          );
        })()}

        {/* Status cards */}
        <div id="overview" className="mt-8 grid gap-4 scroll-mt-28 sm:grid-cols-3">
          <div className="glass-card flex flex-col rounded-xl p-5 transition-[border-color] hover:border-[var(--border-hover)]">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {copy.teamLabel}
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(168,85,247,0.12)]">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
              {team ? `${team.memberCount}/${team.maxMembers}` : "—"}
            </p>
            {team ? (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--accent-purple)] transition-all duration-500"
                  style={{ width: `${teamOccupancy}%` }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-[var(--text-muted)]">{copy.noTeam}</p>
            )}
          </div>

          <div className="glass-card flex flex-col rounded-xl p-5 transition-[border-color] hover:border-[var(--border-hover)]">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {copy.screeningLabel}
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(59,130,246,0.12)]">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
            </div>
            {team ? (
              <div className="mt-3">
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold ${screeningDisplay.bg} ${screeningDisplay.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${screeningDisplay.color === "text-emerald-400" ? "bg-emerald-400" : screeningDisplay.color === "text-amber-400" ? "bg-amber-400" : screeningDisplay.color === "text-red-400" ? "bg-red-400" : "bg-white/40"}`} />
                  {screeningDisplay.label}
                </span>
              </div>
            ) : (
              <p className="mt-3 text-2xl font-semibold text-[var(--text-muted)]">—</p>
            )}
          </div>

          <div className="glass-card flex flex-col rounded-xl p-5 transition-[border-color] hover:border-[var(--border-hover)]">
            <div className="flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {copy.readinessLabel}
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(34,197,94,0.12)]">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-white">
              {readinessScore}%
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${readinessScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Team section */}
        <section id="team" className="mt-10 scroll-mt-28">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-purple)]">
              {copy.sectionTeam}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
              {copy.teamPanelTitle}
            </h2>
          </div>

          {isTeamLoading ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-48 animate-pulse rounded bg-white/5" />
                </div>
              </div>
            </div>
          ) : team ? (
            <SpotlightCard
              className="overflow-hidden p-5 sm:p-6"
              spotlightColor="rgba(168,85,247,0.14)"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-white sm:text-2xl">
                        {team.name}
                      </h3>
                      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {team.currentUserMembership?.role === "lead"
                          ? copy.captainBadge
                          : copy.memberBadge}
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
                      {team.description || copy.teamDescriptionFallback}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {copy.teamSeats}
                      </p>
                      <p className="text-xl font-semibold tabular-nums text-white">
                        {team.memberCount}/{team.maxMembers}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                        {copy.teamInvite}
                      </p>
                      <p className="text-sm font-medium text-white">{inviteState}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                    {copy.teamCodeLabel}
                  </p>
                  <p className="mt-2 flex items-center gap-2 break-all font-mono text-lg font-semibold tracking-widest text-white">
                    {team.invite?.code ?? "—"}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={handleCopyInvite}
                      title={copy.copyCode}
                    >
                      <Copy size={14} />
                    </Button>
                  </p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {copy.inviteNote}
                  </p>
                </div>

                {/* Members list */}
                <div className="border-t border-[var(--border-color)] pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {copy.membersTitle}
                    </p>
                    <span className="rounded-md bg-white/5 px-2.5 py-1 font-mono text-xs font-medium tabular-nums text-white">
                      {team.memberCount}/{team.maxMembers}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {team.members.map((member) => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{member.name}</p>
                          <p className="truncate text-xs text-[var(--text-secondary)]">
                            {member.email}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                          {member.role === "lead" ? copy.captainBadge : copy.memberBadge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-[var(--border-color)] pt-4">
                  {team.currentUserMembership?.role === "lead" && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      className="rounded-xl"
                      onClick={handleRotateInvite}
                      disabled={activeAction === "rotate"}
                    >
                      <Sparkles size={16} />
                      {activeAction === "rotate" ? copy.rotatingCode : copy.rotateCode}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className="rounded-xl border border-red-500/20 text-red-200 hover:bg-red-500/10 hover:text-white"
                    onClick={handleLeaveTeam}
                    disabled={activeAction === "leave"}
                  >
                    <DoorOpen size={16} />
                    {activeAction === "leave" ? copy.leavingTeam : copy.leaveTeam}
                  </Button>
                </div>
              </div>
            </SpotlightCard>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(59,130,246,0.12)">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent-blue)]">
                      {copy.createTeamTitle}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {copy.createTeamTitle}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {copy.createTeamDesc}
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleCreateTeam}>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        {copy.teamNameLabel}
                      </span>
                      <input
                        value={createName}
                        onChange={(event) => setCreateName(event.target.value)}
                        className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                        placeholder={copy.createTeamNamePlaceholder}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        {copy.teamDescriptionLabel}
                      </span>
                      <textarea
                        value={createDescription}
                        onChange={(event) => setCreateDescription(event.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                        placeholder={copy.createTeamDescriptionPlaceholder}
                      />
                    </label>

                    <Button
                      type="submit"
                      size="md"
                      className="w-full rounded-lg"
                      disabled={activeAction === "create"}
                    >
                      <ArrowRight size={16} />
                      {activeAction === "create"
                        ? copy.creatingTeamAction
                        : copy.createTeamAction}
                    </Button>
                  </form>
                </div>
              </SpotlightCard>

              <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(168,85,247,0.12)">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent-purple)]">
                      {copy.joinTeamTitle}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {copy.joinTeamTitle}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {copy.joinTeamDesc}
                    </p>
                  </div>

                  <form className="space-y-4" onSubmit={handleJoinTeam}>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                        {copy.teamCodeLabel}
                      </span>
                      <input
                        value={joinCode}
                        onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                        className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 font-mono tracking-widest text-white outline-none transition-colors focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)]/30"
                        placeholder={copy.joinCodePlaceholder}
                        required
                      />
                    </label>

                    <Button
                      type="submit"
                      variant="secondary"
                      size="md"
                      className="w-full rounded-lg"
                      disabled={activeAction === "join"}
                    >
                      <Users size={16} />
                      {activeAction === "join"
                        ? copy.joiningTeamAction
                        : copy.joinTeamAction}
                    </Button>
                  </form>

                  <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-4 text-xs text-[var(--text-secondary)]">
                    {copy.noTeamState}
                  </div>
                </div>
              </SpotlightCard>
            </div>
          )}
        </section>

        {/* Mentor request section — only for approved teams */}
        {team?.screeningStatus === "approved" && (
          <section className="mt-10">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
                Mentor
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                Request a consultation
              </h2>
            </div>

            {!mentorRequest ? (
              <div className="flex flex-col gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-blue)]" />
                  <div>
                    <p className="font-medium text-white">Need help from a mentor?</p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      Tap the button and an available mentor will be notified and reach out.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={mentorRequestLoading}
                  onClick={() => void handleRequestMentor()}
                  className="shrink-0 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
                >
                  {mentorRequestLoading ? "Sending…" : "Request mentor"}
                </button>
              </div>
            ) : mentorRequest.status === "matched" ? (
              <div className="flex items-start gap-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-emerald-200">A mentor accepted your request!</p>
                  {mentorRequest.mentorName && (
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {mentorRequest.mentorName} will be with you shortly.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                  <div>
                    <p className="font-semibold text-amber-200">
                      {mentorRequest.status === "assigned"
                        ? "Mentor notified, waiting for confirmation…"
                        : "Finding an available mentor…"}
                    </p>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      You will get updates automatically.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={mentorRequestActionLoading}
                  onClick={() => void handleCancelMentorRequest()}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                >
                  {mentorRequestActionLoading ? "Cancelling…" : "Cancel request"}
                </button>
              </div>
            )}
          </section>
        )}

        {peerVotingActive && (
          <section id="vote" className="mt-10 scroll-mt-28">
            <PeerVotingSection />
          </section>
        )}

        {team && (
          <section id="app-url" className="mt-10 scroll-mt-28">
            <AppUrlSection
              isLead={team.currentUserMembership?.role === "lead" || Boolean(user?.isTeamLead)}
            />
          </section>
        )}

        <section id="credits" className="mt-10 scroll-mt-28">
          <h2 className="mb-4 text-lg font-semibold text-white">{copy.sectionCredits}</h2>
          <PartnerCreditsPanel
            creditsContext={{
              hasTeam: !!team,
              screeningStatus: team?.screeningStatus ?? null,
            }}
          />
        </section>

        {team && (
          <ProjectStatusCard
            teamApproved={team.screeningStatus === "approved"}
          />
        )}

        {/* Account */}
        <section id="account" className="mt-10 scroll-mt-28 pb-12">
          <h2 className="mb-4 text-lg font-semibold text-white">{copy.accountTitle}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: copy.accountName, value: user.name ?? "—", icon: UserRound },
              { label: copy.accountEmail, value: user.email ?? "—", icon: Mail },
              { label: copy.accountRole, value: roleLabel, icon: Crown },
              {
                label: copy.accountVerified,
                value: user.emailVerified ? copy.yes : copy.no,
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[var(--text-muted)]">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-white">
                      {item.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </DashboardLayout>
    </>
  );
}
