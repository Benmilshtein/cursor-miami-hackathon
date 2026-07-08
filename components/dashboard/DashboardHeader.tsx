"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Home, ShieldCheck, Users } from "lucide-react";
import { Logo } from "@/components/ui";

type DashboardHeaderProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  readinessLabel: string;
  readinessValue: string;
  teamLabel: string;
  teamValue: string;
  securityLabel: string;
  securityValue: string;
  homeLabel: string;
};

export function DashboardHeader({
  eyebrow,
  title,
  subtitle,
  readinessLabel,
  readinessValue,
  teamLabel,
  teamValue,
  securityLabel,
  securityValue,
  homeLabel,
}: DashboardHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="glass-card relative overflow-hidden p-5 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255, 45, 146,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(255, 107, 92,0.08),transparent_45%)]" />

      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Logo size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--accent-blue)]">
                {eyebrow}
              </p>
              <h1 className="mt-0.5 truncate text-xl font-semibold text-white sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1 line-clamp-2 max-w-xl text-sm text-[var(--text-secondary)]">
                {subtitle}
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)]"
          >
            <Home size={16} />
            {homeLabel}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border border-white/8 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <ArrowUpRight size={14} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{readinessLabel}</span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-white sm:text-xl">{readinessValue}</p>
          </div>

          <div className="rounded-lg border border-white/8 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <Users size={14} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{teamLabel}</span>
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums text-white sm:text-xl">{teamValue}</p>
          </div>

          <div className="rounded-lg border border-white/8 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{securityLabel}</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-white sm:text-xl">{securityValue}</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
