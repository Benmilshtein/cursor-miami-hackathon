"use client";

import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Compass,
  Copy,
  Crown,
  Gift,
  DoorOpen,
  Gauge,
  Mail,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  UserRound,
} from "lucide-react";
import { PartnerCreditsPanel } from "@/components/participant/PartnerCreditsPanel";
import { Footer } from "@/components/Footer";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardMeter } from "@/components/dashboard/DashboardMeter";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardStatCard } from "@/components/dashboard/DashboardStatCard";
import { Button, Card, NoiseOverlay, SpotlightCard } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/lib/LanguageContext";

const DASHBOARD_COPY = {
  en: {
    loading: "Loading your dashboard...",
    eyebrow: "PARTICIPANT DASHBOARD",
    title: "Team and account dashboard",
    subtitle:
      "Track team state, personal registration traction, and readiness for the next hackathon stages.",
    home: "Back home",
    readinessLabel: "Readiness",
    teamLabel: "Team",
    securityLabel: "Security",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    creditsSectionTitle: "Receiving partner credits",
    sectionTraction: "Traction",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    activeTeam: "Team active",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    overviewTitle: "Registration pulse",
    overviewText:
      "This dashboard reads the live Better Auth session and the backend team state, so it mirrors the actual onboarding status.",
    personalStatsTitle: "Personal traction",
    teamStatsTitle: "Team traction",
    accountTitle: "Account data",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    futureTitle: "Next platform modules",
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
    inviteNote: "The invite block reflects the team’s current working join code.",
    teamDescriptionFallback: "No team description yet.",
    occupancyLabel: "Team occupancy",
    occupancyNote: "Shows how close the team is to the 5-member limit.",
    profileCompletionLabel: "Profile completion",
    profileCompletionNote: "Uses name, personal fields, email verification, and team membership.",
    securityLabelCard: "Security lane",
    securityNote: "A regular participant only needs an active session. A super admin also needs a 2FA step-up.",
    leadershipLabel: "Leadership lane",
    leadershipNote: "The captain can manage members, rotate invites, and transfer the lead role.",
    teamReadinessLabel: "Team readiness",
    teamReadinessNote: "Based on occupancy, an active captain, and a valid invite.",
    membersValueLabel: "Members",
    inviteValueLabel: "Invite state",
    securityValueLabel: "Session status",
    statusReady: "Ready",
    statusPending: "Pending",
    statusLocked: "Locked",
    pipelineApplications: "Team application",
    pipelineSubmission: "Project submission",
    pipelineJudging: "Judging surface",
    pipelineCredits: "Partner credits",
    pipelineApplicationsNote: "Opens once the team roster is finalized.",
    pipelineSubmissionNote: "Depends on the next platform modules.",
    pipelineJudgingNote: "Will be activated closer to the hackathon final.",
    pipelineCreditsNote: "Tied to partner distributions and team state.",
    accountName: "System name",
    accountEmail: "Email",
    accountUserId: "User ID",
    accountRole: "Role",
    accountTeam: "Team state",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
  },
  de: {
    loading: "Loading your dashboard...",
    eyebrow: "PARTICIPANT DASHBOARD",
    title: "Team and account dashboard",
    subtitle:
      "Track team state, personal registration traction, and readiness for the next hackathon stages.",
    home: "Back home",
    readinessLabel: "Readiness",
    teamLabel: "Team",
    securityLabel: "Security",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    creditsSectionTitle: "Receiving partner credits",
    sectionTraction: "Traction",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    activeTeam: "Team active",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    overviewTitle: "Registration pulse",
    overviewText:
      "This dashboard reads the live Better Auth session and the backend team state, so it mirrors the actual onboarding status.",
    personalStatsTitle: "Personal traction",
    teamStatsTitle: "Team traction",
    accountTitle: "Account data",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    futureTitle: "Next platform modules",
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
    inviteNote: "The invite block reflects the team’s current working join code.",
    teamDescriptionFallback: "No team description yet.",
    occupancyLabel: "Team occupancy",
    occupancyNote: "Shows how close the team is to the 5-member limit.",
    profileCompletionLabel: "Profile completion",
    profileCompletionNote: "Uses name, personal fields, email verification, and team membership.",
    securityLabelCard: "Security lane",
    securityNote: "A regular participant only needs an active session. A super admin also needs a 2FA step-up.",
    leadershipLabel: "Leadership lane",
    leadershipNote: "The captain can manage members, rotate invites, and transfer the lead role.",
    teamReadinessLabel: "Team readiness",
    teamReadinessNote: "Based on occupancy, an active captain, and a valid invite.",
    membersValueLabel: "Members",
    inviteValueLabel: "Invite state",
    securityValueLabel: "Session status",
    statusReady: "Ready",
    statusPending: "Pending",
    statusLocked: "Locked",
    pipelineApplications: "Team application",
    pipelineSubmission: "Project submission",
    pipelineJudging: "Judging surface",
    pipelineCredits: "Partner credits",
    pipelineApplicationsNote: "Opens once the team roster is finalized.",
    pipelineSubmissionNote: "Depends on the next platform modules.",
    pipelineJudgingNote: "Will be activated closer to the hackathon final.",
    pipelineCreditsNote: "Tied to partner distributions and team state.",
    accountName: "System name",
    accountEmail: "Email",
    accountUserId: "User ID",
    accountRole: "Role",
    accountTeam: "Team state",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
  },
  es: {
    loading: "Loading your dashboard...",
    eyebrow: "PARTICIPANT DASHBOARD",
    title: "Team and account dashboard",
    subtitle:
      "Track team state, personal registration traction, and readiness for the next hackathon stages.",
    home: "Back home",
    readinessLabel: "Readiness",
    teamLabel: "Team",
    securityLabel: "Security",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    creditsSectionTitle: "Receiving partner credits",
    sectionTraction: "Traction",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    roleModerator: "Moderator",
    roleReviewer: "Reviewer",
    noTeam: "No team yet",
    activeTeam: "Team active",
    teamSeats: "Team seats",
    teamInvite: "Invite",
    inviteActive: "Active",
    inviteExpired: "Expired",
    inviteMissing: "Missing",
    overviewTitle: "Registration pulse",
    overviewText:
      "This dashboard reads the live Better Auth session and the backend team state, so it mirrors the actual onboarding status.",
    personalStatsTitle: "Personal traction",
    teamStatsTitle: "Team traction",
    accountTitle: "Account data",
    teamPanelTitle: "Team block",
    membersTitle: "Team members",
    futureTitle: "Next platform modules",
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
    inviteNote: "The invite block reflects the team’s current working join code.",
    teamDescriptionFallback: "No team description yet.",
    occupancyLabel: "Team occupancy",
    occupancyNote: "Shows how close the team is to the 5-member limit.",
    profileCompletionLabel: "Profile completion",
    profileCompletionNote: "Uses name, personal fields, email verification, and team membership.",
    securityLabelCard: "Security lane",
    securityNote: "A regular participant only needs an active session. A super admin also needs a 2FA step-up.",
    leadershipLabel: "Leadership lane",
    leadershipNote: "The captain can manage members, rotate invites, and transfer the lead role.",
    teamReadinessLabel: "Team readiness",
    teamReadinessNote: "Based on occupancy, an active captain, and a valid invite.",
    membersValueLabel: "Members",
    inviteValueLabel: "Invite state",
    securityValueLabel: "Session status",
    statusReady: "Ready",
    statusPending: "Pending",
    statusLocked: "Locked",
    pipelineApplications: "Team application",
    pipelineSubmission: "Project submission",
    pipelineJudging: "Judging surface",
    pipelineCredits: "Partner credits",
    pipelineApplicationsNote: "Opens once the team roster is finalized.",
    pipelineSubmissionNote: "Depends on the next platform modules.",
    pipelineJudgingNote: "Will be activated closer to the hackathon final.",
    pipelineCreditsNote: "Tied to partner distributions and team state.",
    accountName: "System name",
    accountEmail: "Email",
    accountUserId: "User ID",
    accountRole: "Role",
    accountTeam: "Team state",
    accountVerified: "Email verified",
    yes: "Yes",
    no: "No",
    loadError: "Failed to load the current team state.",
    signOutError: "Failed to sign out.",
    createSuccess: "Team created and ready for invites.",
    joinSuccess: "You joined the team successfully.",
    rotateSuccess: "A fresh invite code is now active.",
    leaveSuccess: "You left the team.",
  },
} as const;

const LOADING_UI = (
  <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

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

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
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

export default function ProfilePage() {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [isTeamLoading, setIsTeamLoading] = useState(true);
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

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/register");
    }
  }, [isPending, router, session]);

  useEffect(() => {
    let ignore = false;

    async function loadTeamState() {
      if (!session?.user) {
        return;
      }

      setIsTeamLoading(true);
      setPageError(null);

      try {
        const nextTeam = await requestApi<TeamData | null>("/api/teams/current");

        if (!ignore) {
          setTeam(nextTeam);
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
  const securityState = user?.role === "super_admin"
    ? user.twoFactorEnabled
      ? copy.statusReady
      : copy.statusPending
    : copy.statusReady;
  const inviteState = team?.invite
    ? team.invite.isExpired
      ? copy.inviteExpired
      : copy.inviteActive
    : copy.inviteMissing;
  const roleLabel = formatRole(user, team, copy);
  const teamSummary = team ? `${team.memberCount}/${team.maxMembers}` : copy.noTeam;
  const readinessScore = team
    ? Math.round((profileCompletion + teamReadiness) / 2)
    : Math.round(profileCompletion * 0.75);

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
        {LOADING_UI}
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_28%)]" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <DashboardHeader
            eyebrow={copy.eyebrow}
            title={copy.title}
            subtitle={copy.subtitle}
            readinessLabel={copy.readinessLabel}
            readinessValue={formatPercent(readinessScore)}
            teamLabel={copy.teamLabel}
            teamValue={teamSummary}
            securityLabel={copy.securityLabel}
            securityValue={securityState}
            homeLabel={copy.home}
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
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
                { href: "#credits", label: copy.sectionCredits, icon: Gift },
                { href: "#traction", label: copy.sectionTraction, icon: Activity },
                { href: "#account", label: copy.sectionAccount, icon: Shield },
              ]}
              signOutLabel={isSigningOut ? copy.signingOut : copy.signOut}
              isSigningOut={isSigningOut}
              onSignOut={handleSignOut}
            />

            <main className="space-y-6 pb-12">
              {(pageError || teamActionError || teamActionNotice) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {pageError ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {pageError}
                    </div>
                  ) : null}
                  {teamActionError ? (
                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {teamActionError}
                    </div>
                  ) : null}
                  {teamActionNotice ? (
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                      {teamActionNotice}
                    </div>
                  ) : null}
                </motion.div>
              )}

              <section id="overview" className="space-y-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-blue)]">
                      {copy.sectionOverview}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">
                      {copy.overviewTitle}
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                    {copy.overviewText}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <DashboardStatCard
                    icon={Gauge}
                    label={copy.profileCompletionLabel}
                    value={formatPercent(profileCompletion)}
                    note={copy.profileCompletionNote}
                    accent="blue"
                  />
                  <DashboardStatCard
                    icon={Users}
                    label={copy.occupancyLabel}
                    value={team ? `${team.memberCount}/${team.maxMembers}` : copy.noTeam}
                    note={copy.occupancyNote}
                    accent="purple"
                  />
                  <DashboardStatCard
                    icon={Crown}
                    label={copy.leadershipLabel}
                    value={roleLabel}
                    note={copy.leadershipNote}
                    accent="green"
                  />
                  <DashboardStatCard
                    icon={ShieldCheck}
                    label={copy.securityLabelCard}
                    value={securityState}
                    note={copy.securityNote}
                    accent="blue"
                  />
                </div>
              </section>

              <section id="team" className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-purple)]">
                    {copy.sectionTeam}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{copy.teamPanelTitle}</h2>
                </div>

                {isTeamLoading ? (
                  <Card className="p-6 text-sm text-[var(--text-secondary)]" hover={false}>
                    {copy.loading}
                  </Card>
                ) : team ? (
                  <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                    <SpotlightCard
                      className="overflow-hidden p-6"
                      spotlightColor="rgba(168,85,247,0.18)"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-2xl font-semibold text-white">{team.name}</h3>
                              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                {team.currentUserMembership?.role === "lead"
                                  ? copy.captainBadge
                                  : copy.memberBadge}
                              </span>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                              {team.description || copy.teamDescriptionFallback}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                            <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                              {copy.teamSeats}
                            </p>
                            <p className="mt-2 text-2xl font-semibold text-white">
                              {team.memberCount}/{team.maxMembers}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              {copy.teamCodeLabel}
                            </p>
                            <p className="mt-3 break-all text-2xl font-semibold tracking-[0.18em] text-white">
                              {team.invite?.code ?? "—"}
                            </p>
                            <p className="mt-3 text-sm text-[var(--text-secondary)]">
                              {copy.inviteNote}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/70 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                              {copy.teamInvite}
                            </p>
                            <p className="mt-3 text-2xl font-semibold text-white">{inviteState}</p>
                            <p className="mt-3 text-sm text-[var(--text-secondary)]">
                              {team.status === "active" ? copy.activeTeam : copy.statusLocked}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="md"
                            className="min-h-[48px] rounded-2xl"
                            onClick={handleCopyInvite}
                          >
                            <Copy size={16} />
                            {copy.copyCode}
                          </Button>

                          {team.currentUserMembership?.role === "lead" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="md"
                              className="min-h-[48px] rounded-2xl"
                              onClick={handleRotateInvite}
                              disabled={activeAction === "rotate"}
                            >
                              <Sparkles size={16} />
                              {activeAction === "rotate" ? copy.rotatingCode : copy.rotateCode}
                            </Button>
                          ) : null}

                          <Button
                            type="button"
                            variant="ghost"
                            size="md"
                            className="min-h-[48px] rounded-2xl border border-red-500/20 text-red-200 hover:bg-red-500/10 hover:text-white"
                            onClick={handleLeaveTeam}
                            disabled={activeAction === "leave"}
                          >
                            <DoorOpen size={16} />
                            {activeAction === "leave" ? copy.leavingTeam : copy.leaveTeam}
                          </Button>
                        </div>
                      </div>
                    </SpotlightCard>

                    <Card padding="lg" className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {copy.membersTitle}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-white">
                            {team.memberCount} / {team.maxMembers}
                          </h3>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                          <Users size={18} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {team.members.map((member) => (
                          <div
                            key={member.userId}
                            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/65 p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                  {member.email}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                {member.role === "lead" ? copy.captainBadge : copy.memberBadge}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <SpotlightCard className="p-6" spotlightColor="rgba(59,130,246,0.16)">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-blue)]">
                            {copy.createTeamTitle}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold text-white">
                            {copy.createTeamTitle}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {copy.createTeamDesc}
                          </p>
                        </div>

                        <form className="space-y-4" onSubmit={handleCreateTeam}>
                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                              {copy.teamNameLabel}
                            </span>
                            <input
                              value={createName}
                              onChange={(event) => setCreateName(event.target.value)}
                              className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent-blue)]"
                              placeholder="Cursor Core"
                              required
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                              {copy.teamDescriptionLabel}
                            </span>
                            <textarea
                              value={createDescription}
                              onChange={(event) => setCreateDescription(event.target.value)}
                              rows={4}
                              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent-blue)]"
                              placeholder="AI product, workflow or infra focus"
                            />
                          </label>

                          <Button
                            type="submit"
                            size="md"
                            className="min-h-[48px] rounded-2xl"
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

                    <SpotlightCard className="p-6" spotlightColor="rgba(168,85,247,0.16)">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-purple)]">
                            {copy.joinTeamTitle}
                          </p>
                          <h3 className="mt-2 text-2xl font-semibold text-white">
                            {copy.joinTeamTitle}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                            {copy.joinTeamDesc}
                          </p>
                        </div>

                        <form className="space-y-4" onSubmit={handleJoinTeam}>
                          <label className="block">
                            <span className="mb-2 block text-sm text-[var(--text-secondary)]">
                              {copy.teamCodeLabel}
                            </span>
                            <input
                              value={joinCode}
                              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                              className="min-h-[48px] w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent-purple)]"
                              placeholder="7AB4K9XZ"
                              required
                            />
                          </label>

                          <Button
                            type="submit"
                            variant="secondary"
                            size="md"
                            className="min-h-[48px] rounded-2xl"
                            disabled={activeAction === "join"}
                          >
                            <Users size={16} />
                            {activeAction === "join"
                              ? copy.joiningTeamAction
                              : copy.joinTeamAction}
                          </Button>
                        </form>

                        <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/55 p-4 text-sm leading-6 text-[var(--text-secondary)]">
                          {copy.noTeamState}
                        </div>
                      </div>
                    </SpotlightCard>
                  </div>
                )}
              </section>

              <section id="credits" className="scroll-mt-28 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-blue)]">
                    {copy.sectionCredits}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{copy.creditsSectionTitle}</h2>
                </div>
                <PartnerCreditsPanel
                  creditsContext={{
                    hasTeam: !!team,
                    screeningStatus: team?.screeningStatus ?? null,
                  }}
                />
              </section>

              <section id="traction" className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-green)]">
                    {copy.sectionTraction}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {copy.personalStatsTitle} / {copy.teamStatsTitle}
                  </h2>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Card padding="lg" className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                        <UserRound size={18} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">
                          {copy.personalStatsTitle}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {copy.profileCompletionNote}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <DashboardMeter
                        label={copy.profileCompletionLabel}
                        value={profileCompletion}
                        valueLabel={formatPercent(profileCompletion)}
                        note={copy.profileCompletionNote}
                        accent="blue"
                      />
                      <DashboardMeter
                        label={copy.securityLabelCard}
                        value={user.role === "super_admin" ? (user.twoFactorEnabled ? 100 : 45) : 100}
                        valueLabel={securityState}
                        note={copy.securityNote}
                        accent="purple"
                      />
                      <DashboardMeter
                        label={copy.leadershipLabel}
                        value={team?.currentUserMembership?.role === "lead" ? 100 : team ? 68 : 15}
                        valueLabel={roleLabel}
                        note={copy.leadershipNote}
                        accent="green"
                      />
                    </div>
                  </Card>

                  <Card padding="lg" className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                        <Target size={18} />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{copy.teamStatsTitle}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {copy.teamReadinessNote}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <DashboardMeter
                        label={copy.teamReadinessLabel}
                        value={teamReadiness}
                        valueLabel={formatPercent(teamReadiness)}
                        note={copy.teamReadinessNote}
                        accent="blue"
                      />
                      <DashboardMeter
                        label={copy.occupancyLabel}
                        value={teamOccupancy}
                        valueLabel={team ? `${team.memberCount}/${team.maxMembers}` : copy.noTeam}
                        note={copy.occupancyNote}
                        accent="purple"
                      />
                      <DashboardMeter
                        label={copy.teamInvite}
                        value={team?.invite ? (team.invite.isExpired ? 30 : 100) : 0}
                        valueLabel={inviteState}
                        note={copy.inviteNote}
                        accent="green"
                      />
                    </div>
                  </Card>
                </div>

                <Card padding="lg" className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-white">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">{copy.futureTitle}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {copy.pipelineSubmissionNote}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        title: copy.pipelineApplications,
                        status: team ? copy.statusReady : copy.statusPending,
                        note: copy.pipelineApplicationsNote,
                      },
                      {
                        title: copy.pipelineSubmission,
                        status: team ? copy.statusPending : copy.statusLocked,
                        note: copy.pipelineSubmissionNote,
                      },
                      {
                        title: copy.pipelineJudging,
                        status: copy.statusLocked,
                        note: copy.pipelineJudgingNote,
                      },
                      {
                        title: copy.pipelineCredits,
                        status:
                          team && team.screeningStatus === "approved"
                            ? copy.statusReady
                            : team
                              ? copy.statusPending
                              : copy.statusLocked,
                        note: copy.pipelineCreditsNote,
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/65 p-4"
                      >
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--accent-blue)]">
                          {item.status}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              </section>

              <section id="account" className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-blue)]">
                    {copy.sectionAccount}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{copy.accountTitle}</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { label: copy.accountName, value: user.name ?? "—", icon: UserRound },
                    { label: copy.accountEmail, value: user.email ?? "—", icon: Mail },
                    { label: copy.accountUserId, value: user.id ?? "—", icon: Shield },
                    { label: copy.accountRole, value: roleLabel, icon: Crown },
                    {
                      label: copy.accountTeam,
                      value: team ? `${team.name} (${team.memberCount}/${team.maxMembers})` : copy.noTeam,
                      icon: Users,
                    },
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
                        className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/65 p-5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {item.label}
                          </p>
                          <Icon size={16} className="text-[var(--text-muted)]" />
                        </div>
                        <p className="mt-4 break-all text-lg font-semibold text-white">
                          {item.value}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            </main>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
