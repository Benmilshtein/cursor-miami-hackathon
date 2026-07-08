"use client";

import type { LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

export type PerformanceItemProps = {
  icon: LucideIcon;
  label: string;
  description?: string;
  value: string | number;
  progress?: number;
};

type PerformanceCardProps = {
  title: string;
  items: PerformanceItemProps[];
  action?: ReactNode;
};

export function PerformanceCard({ title, items, action }: PerformanceCardProps) {
  return (
    <div className="glass-card flex flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-4 p-5">
        {items.map((item, i) => {
          const Icon = item.icon;
          const progress = item.progress ?? 0;
          return (
            <div key={i} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white">{item.label}</p>
                    {item.description ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-white">
                  {item.value}
                </span>
              </div>
              {typeof progress === "number" && (
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-blue)] transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
