"use client";

import Link from "next/link";
import { Users, UserCog, ShieldCheck, Coins, Building2, Trophy } from "lucide-react";

export default function AdminDashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Super Admin Dashboard</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Manage teams, users, partners, and credit distribution. All actions require 2FA step-up.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/dashboard/teams"
          className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <Users className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Teams</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              List, edit names and descriptions, manage membership (assign, remove, transfer lead).
            </p>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/users"
          className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <UserCog className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Users</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              List users, filter by role, change user roles (participant, moderator, reviewer, super_admin).
            </p>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/partners"
          className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <Building2 className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Partners</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Manage partners (software/products). Required before creating credit pools.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/credits"
          className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <Coins className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Credits</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Create pools, add credits, distribute evenly to teams or participants. Each credit is a short redeem link.
            </p>
          </div>
        </Link>

        <Link
          href="/admin/dashboard/ranking"
          className="flex items-center gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 transition-colors hover:border-[var(--accent-blue)]/50 hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
            <Trophy className="h-6 w-6 text-[var(--accent-blue)]" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Ranking</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              View scoring progress and finalize the ranking when all judges have evaluated.
            </p>
          </div>
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400" />
          <h2 className="font-semibold text-white">2FA step-up</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Admin actions use a 15-minute verification cookie. When it expires, you will be asked to enter your TOTP code again on this dashboard.
        </p>
      </div>
    </div>
  );
}
