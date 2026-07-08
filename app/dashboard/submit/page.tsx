"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  FolderGit2,
  Gift,
  Home,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProjectSection } from "@/components/dashboard/ProjectSection";
import { NoiseOverlay } from "@/components/ui";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/lib/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const COPY = {
  en: {
    loading: "Loading the submission portal...",
    eyebrow: "SUBMISSION PORTAL",
    title: "Submit your project",
    subtitle:
      "Share your build with the judges. Make sure your GitHub repo is public and your demo link works before the deadline.",
    backToDashboard: "Back to dashboard",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    teamLabel: "Team",
    noTeam: "No team yet",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    notEligibleTitle: "Not eligible yet",
    notEligibleNoTeam:
      "You need to be on an approved team to access the submission portal.",
    notEligibleNotApproved:
      "Your team hasn't been approved through screening yet. Once approved, you'll be able to submit your project here.",
    notEligibleCta: "Go to dashboard",
    criteriaTitle: "How you'll be evaluated",
    criteriaSubtitle: "Judges score each submission across these dimensions.",
  },
  de: {
    loading: "Loading the submission portal...",
    eyebrow: "SUBMISSION PORTAL",
    title: "Submit your project",
    subtitle:
      "Share your build with the judges. Make sure your GitHub repo is public and your demo link works before the deadline.",
    backToDashboard: "Back to dashboard",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    teamLabel: "Team",
    noTeam: "No team yet",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    notEligibleTitle: "Not eligible yet",
    notEligibleNoTeam:
      "You need to be on an approved team to access the submission portal.",
    notEligibleNotApproved:
      "Your team hasn't been approved through screening yet. Once approved, you'll be able to submit your project here.",
    notEligibleCta: "Go to dashboard",
    criteriaTitle: "How you'll be evaluated",
    criteriaSubtitle: "Judges score each submission across these dimensions.",
  },
  es: {
    loading: "Loading the submission portal...",
    eyebrow: "SUBMISSION PORTAL",
    title: "Submit your project",
    subtitle:
      "Share your build with the judges. Make sure your GitHub repo is public and your demo link works before the deadline.",
    backToDashboard: "Back to dashboard",
    home: "Back home",
    ranking: "Ranking",
    sectionOverview: "Overview",
    sectionTeam: "Team",
    sectionCredits: "Credits",
    sectionProject: "Project",
    sectionAccount: "Account",
    signOut: "Sign out",
    signingOut: "Signing out...",
    collapseSidebar: "Collapse",
    expandSidebar: "Expand",
    teamLabel: "Team",
    noTeam: "No team yet",
    roleParticipant: "Participant",
    roleLead: "Captain",
    roleSuperAdmin: "Super admin",
    notEligibleTitle: "Not eligible yet",
    notEligibleNoTeam:
      "You need to be on an approved team to access the submission portal.",
    notEligibleNotApproved:
      "Your team hasn't been approved through screening yet. Once approved, you'll be able to submit your project here.",
    notEligibleCta: "Go to dashboard",
    criteriaTitle: "How you'll be evaluated",
    criteriaSubtitle: "Judges score each submission across these dimensions.",
  },
} as const;

const CRITERIA = [
  { label: "Innovation", weight: 25, color: "var(--accent-blue)" },
  { label: "Technical execution", weight: 25, color: "var(--accent-purple)" },
  { label: "AI usage", weight: 20, color: "var(--accent-green)" },
  { label: "UX / UI", weight: 15, color: "#0891B2" },
  { label: "Business potential", weight: 15, color: "#B45309" },
] as const;

type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  firstName?: string | null;
  teamId?: number | null;
  isTeamLead?: boolean;
  role?: string | null;
};

type TeamMembership = { role: "lead" | "member" } | null;

type TeamData = {
  id: number;
  name: string;
  screeningStatus?: "draft" | "submitted" | "approved" | "rejected";
  currentUserMembership: TeamMembership;
};

export default function SubmitPage() {
  const { language } = useLanguage();
  const copy = COPY[language];
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/register");
    }
  }, [isPending, router, session]);

  useEffect(() => {
    let ignore = false;
    async function loadTeam() {
      if (!session?.user) return;
      try {
        const res = await fetch("/api/teams/current", { credentials: "include" });
        const json = await res.json();
        if (!ignore && json?.success) {
          setTeam(json.data as TeamData | null);
        }
      } catch {
        /* silent */
      } finally {
        if (!ignore) setTeamLoading(false);
      }
    }
    if (!isPending && session?.user) {
      void loadTeam();
    }
    return () => {
      ignore = true;
    };
  }, [isPending, session]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await authClient.signOut();
      startTransition(() => {
        router.replace("/register");
        router.refresh();
      });
    } catch {
      setIsSigningOut(false);
    }
  }

  if (isPending || !session) {
    return (
      <>
        <NoiseOverlay />
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{copy.loading}</div>
        </div>
      </>
    );
  }

  const user = session.user as SessionUser;
  const isLead =
    team?.currentUserMembership?.role === "lead" || Boolean(user.isTeamLead);
  const teamApproved = team?.screeningStatus === "approved";

  const initials = user.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const roleLabel = (() => {
    if (user.role === "super_admin") return copy.roleSuperAdmin;
    if (isLead) return copy.roleLead;
    return copy.roleParticipant;
  })();

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
                { href: "/dashboard#overview", label: copy.sectionOverview, icon: Compass },
                { href: "/dashboard#team", label: copy.sectionTeam, icon: Users },
                { href: "/dashboard#credits", label: copy.sectionCredits, icon: Gift },
                ...(teamApproved
                  ? [{ href: "/dashboard/submit", label: copy.sectionProject, icon: FolderGit2 }]
                  : []),
                { href: "/dashboard#account", label: copy.sectionAccount, icon: Shield },
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
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-white"
            >
              <ArrowLeft size={12} />
              {copy.backToDashboard}
            </Link>
            <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base">
              {copy.subtitle}
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

        {/* Body */}
        <div className="mt-10">
          {teamLoading ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-8">
              <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
              <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/5" />
            </div>
          ) : !team ? (
            <NotEligible
              title={copy.notEligibleTitle}
              message={copy.notEligibleNoTeam}
              cta={copy.notEligibleCta}
            />
          ) : !teamApproved ? (
            <NotEligible
              title={copy.notEligibleTitle}
              message={copy.notEligibleNotApproved}
              cta={copy.notEligibleCta}
            />
          ) : (
            <>
              <ProjectSection isTeamLead={isLead} teamApproved={true} />

              {/* Inline evaluation criteria preview */}
              <section className="mt-12 border-t border-[var(--border-color)] pt-8 pb-12">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {copy.criteriaTitle}
                    </h2>
                    <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                      {copy.criteriaSubtitle}
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {CRITERIA.map((c) => (
                    <div
                      key={c.label}
                      className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-4"
                    >
                      <div
                        className="h-1 w-8 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <p className="mt-3 text-sm font-medium text-white">{c.label}</p>
                      <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                        {c.weight}%
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </DashboardLayout>
    </>
  );
}

function NotEligible({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-8 text-center sm:p-12">
      <FolderGit2 size={36} className="mx-auto text-[var(--text-muted)]" />
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
        {message}
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-blue)]/90"
      >
        {cta}
      </Link>
    </div>
  );
}
