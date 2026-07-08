"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronsRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export type CollapsibleSidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  notifs?: number;
};

export type DashboardCollapsibleSidebarProps = {
  userName: string;
  userEmail: string;
  initials: string;
  roleLabel: string;
  teamLabel: string;
  teamValue: string;
  navItems: CollapsibleSidebarNavItem[];
  signOutLabel: string;
  isSigningOut: boolean;
  onSignOut: () => void;
  collapseLabel?: string;
  expandLabel?: string;
  /** When "rail", sidebar fills height and uses border-r only (no rounded corners). */
  variant?: "card" | "rail";
};

function SidebarOption({
  Icon,
  title,
  href,
  selected,
  setSelected,
  open,
  notifs,
}: {
  Icon: LucideIcon;
  title: string;
  href: string;
  selected: string;
  setSelected: (s: string) => void;
  open: boolean;
  notifs?: number;
}) {
  const isSelected = selected === title;

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        setSelected(title);
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }}
      className={`relative flex h-11 w-full items-center rounded-lg transition-all duration-200 ${
        isSelected
          ? "bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] shadow-sm border-l-2 border-[var(--accent-blue)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-white"
      }`}
    >
      <div className="grid h-full w-12 shrink-0 place-content-center">
        <Icon className="h-4 w-4" />
      </div>

      {open && (
        <span
          className={`text-sm font-medium transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        >
          {title}
        </span>
      )}

      {notifs != null && notifs > 0 && open && (
        <span className="absolute right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-blue)] px-1.5 text-xs font-medium text-white">
          {notifs}
        </span>
      )}
    </a>
  );
}

export function DashboardCollapsibleSidebar({
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
  collapseLabel = "Collapse",
  expandLabel = "Expand",
  variant = "card",
}: DashboardCollapsibleSidebarProps) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(navItems[0]?.label ?? "");
  const isRail = variant === "rail";

  return (
    <nav
      className={`flex min-h-full flex-col overflow-hidden bg-[var(--card-bg)] transition-all duration-300 ease-in-out ${
        isRail ? "h-full border-r border-[var(--border-color)]" : "sticky top-6 h-fit rounded-xl border border-[var(--border-color)] shadow-sm backdrop-blur-[10px]"
      } ${open ? "w-64" : "w-16"}`}
    >
      <div className="shrink-0 border-b border-[var(--border-color)] bg-[linear-gradient(135deg,rgba(59,130,246,0.1),rgba(168,85,247,0.06))] p-4">
        <div className="flex cursor-default items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
            {initials ? (
              <span className="text-sm font-semibold text-white">{initials}</span>
            ) : (
              <Logo size={24} />
            )}
          </div>
          {open && (
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">
                {userName}
              </span>
              <span className="block truncate text-xs text-[var(--text-secondary)]">
                {roleLabel} · {teamValue}
              </span>
            </div>
          )}
          {open && (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <SidebarOption
              key={item.href}
              Icon={Icon}
              title={item.label}
              href={item.href}
              selected={selected}
              setSelected={setSelected}
              open={open}
              notifs={item.notifs}
            />
          );
        })}
      </div>

      <div className="shrink-0 border-t border-[var(--border-color)] p-2">
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex h-11 w-full items-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-white disabled:opacity-50"
          title={signOutLabel}
        >
          <div className="grid h-full w-12 shrink-0 place-content-center">
            <LogOut className="h-4 w-4" />
          </div>
          {open && <span className="text-sm font-medium">{signOutLabel}</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full shrink-0 items-center gap-2 border-t border-[var(--border-color)] p-3 transition-colors hover:bg-[var(--bg-secondary)]"
      >
        <div className="grid size-10 shrink-0 place-content-center">
          <ChevronsRight
            className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-300 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        {open && (
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {open ? collapseLabel : expandLabel}
          </span>
        )}
      </button>
    </nav>
  );
}

export default DashboardCollapsibleSidebar;
