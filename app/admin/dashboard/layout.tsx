"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  LogOut,
  Users,
  UserCog,
  Coins,
  Building2,
  ClipboardCheck,
  ListChecks,
  Gavel,
  FolderGit2,
  Trophy,
  BarChart3,
} from "lucide-react";
import { useSessionUser, useAuth } from "@/lib/auth/AuthProvider";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Logo, NoiseOverlay } from "@/components/ui";

type AuthStatus = "loading" | "forbidden" | "ok";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function AdminDashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isPending: sessionPending } = useSessionUser();
  const { signOut } = useAuth();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    if (sessionPending) return;
    if (!user) {
      router.replace("/admin/login?callbackUrl=/admin/dashboard");
      return;
    }
    setAuthStatus(user.role === "super_admin" ? "ok" : "forbidden");
  }, [sessionPending, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/admin/login");
  };

  if (sessionPending || authStatus === "loading") {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
      </>
    );
  }

  if (authStatus === "forbidden") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card p-8 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-2">Access denied</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Super admin access is required for this dashboard.
            </p>
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/dashboard/teams", label: "Teams", icon: Users },
    { href: "/admin/dashboard/users", label: "Users", icon: UserCog },
    { href: "/admin/dashboard/staff", label: "Judges & Mentors", icon: Gavel },
    { href: "/admin/dashboard/projects", label: "Projects", icon: FolderGit2 },
    { href: "/admin/dashboard/screening", label: "Screening", icon: ClipboardCheck },
    { href: "/admin/dashboard/screening/questions", label: "Screening questions", icon: ListChecks },
    { href: "/admin/dashboard/partners", label: "Partners", icon: Building2 },
    { href: "/admin/dashboard/credits", label: "Credits", icon: Coins },
    { href: "/admin/dashboard/scores", label: "Final scores", icon: BarChart3 },
    { href: "/admin/dashboard/ranking", label: "Publish Results", icon: Trophy },
  ];

  const userEmail = user?.email ?? "";

  const sidebar = (
    <div className="flex h-full flex-col border-r border-[var(--border-color)] bg-[var(--card-bg)]">
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[linear-gradient(135deg,rgba(255, 45, 146,0.1),rgba(255, 107, 92,0.06))] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <Logo size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              Super Admin
            </span>
            <span className="block truncate text-xs text-[var(--text-secondary)]">
              {userEmail || " - "}
            </span>
          </div>
        </div>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/admin/dashboard"
              ? pathname === "/admin/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex h-11 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200 ${
                isActive
                  ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border-l-2 border-[var(--accent-blue)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[var(--border-color)] p-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex h-11 w-full items-center gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <NoiseOverlay />
      <DashboardLayout sidebar={sidebar}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </DashboardLayout>
    </>
  );
}
