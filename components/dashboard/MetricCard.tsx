"use client";

import type { LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string | number;
  comparison?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: LucideIcon;
  accent?: "blue" | "purple" | "green" | "cyan" | "amber";
  action?: ReactNode;
};

const accentBgMap = {
  blue: "rgba(59,130,246,0.12)",
  purple: "rgba(168,85,247,0.12)",
  green: "rgba(34,197,94,0.12)",
  cyan: "rgba(8,145,178,0.12)",
  amber: "rgba(180,83,9,0.12)",
};

const trendColorMap = {
  up: "text-[var(--accent-green)]",
  down: "text-red-400",
  neutral: "text-[var(--text-muted)]",
};

export function MetricCard({
  label,
  value,
  comparison,
  trend = "neutral",
  trendLabel,
  icon: Icon,
  accent = "blue",
  action,
}: MetricCardProps) {
  return (
    <div className="glass-card flex h-full flex-col overflow-hidden rounded-xl p-5 transition-[border-color,background] hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        {action}
      </div>
      <div className="mt-3 flex flex-1 items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-white">{value}</p>
          {(comparison ?? trendLabel) && (
            <p className={`mt-1 flex items-center gap-1 text-sm ${trendColorMap[trend]}`}>
              {trend === "up" && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
              {trend === "down" && (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              {trendLabel ?? comparison}
            </p>
          )}
        </div>
        {Icon ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: accentBgMap[accent] }}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
