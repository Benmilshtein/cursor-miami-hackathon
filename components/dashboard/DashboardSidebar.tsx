"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { DashboardCollapsibleSidebar } from "@/components/ui/dashboard-with-collapsible-sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  notifs?: number;
};

type DashboardSidebarProps = {
  userName: string;
  userEmail: string;
  initials: string;
  roleLabel: string;
  teamLabel: string;
  teamValue: string;
  navItems: NavItem[];
  signOutLabel: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  collapseLabel?: string;
  expandLabel?: string;
  variant?: "card" | "rail";
};

export function DashboardSidebar({
  userName,
  userEmail,
  initials,
  roleLabel,
  teamLabel,
  teamValue,
  navItems,
  signOutLabel,
  isSigningOut,
  onSignOut,
  collapseLabel,
  expandLabel,
  variant = "rail",
}: DashboardSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className={variant === "rail" ? "h-full" : "lg:self-start"}
    >
      <DashboardCollapsibleSidebar
        userName={userName}
        userEmail={userEmail}
        initials={initials || "U"}
        roleLabel={roleLabel}
        teamLabel={teamLabel}
        teamValue={teamValue}
        navItems={navItems.map((item) => ({
          href: item.href,
          label: item.label,
          icon: item.icon,
          notifs: item.notifs,
        }))}
        signOutLabel={signOutLabel}
        isSigningOut={isSigningOut}
        onSignOut={onSignOut}
        collapseLabel={collapseLabel}
        expandLabel={expandLabel}
        variant={variant}
      />
    </motion.div>
  );
}
