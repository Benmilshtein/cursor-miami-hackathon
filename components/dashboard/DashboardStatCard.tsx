"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { SpotlightCard } from "@/components/ui";

type DashboardStatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  note: string;
  accent?: "blue" | "purple" | "green";
};

const accentMap = {
  blue: "rgba(59,130,246,0.16)",
  purple: "rgba(168,85,247,0.16)",
  green: "rgba(34,197,94,0.16)",
};

export function DashboardStatCard({
  icon: Icon,
  label,
  value,
  note,
  accent = "blue",
}: DashboardStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <SpotlightCard className="h-full p-5" spotlightColor={accentMap[accent]}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--text-muted)]">
              {label}
            </p>
            <p className="text-3xl font-semibold text-white">{value}</p>
            <p className="text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-white">
            <Icon size={18} />
          </div>
        </div>
      </SpotlightCard>
    </motion.div>
  );
}
