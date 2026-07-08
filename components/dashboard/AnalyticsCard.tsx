"use client";

import { type ReactNode } from "react";

export type MiniMetricItem = {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  comparison?: string;
};

type AnalyticsCardProps = {
  title: string;
  miniMetrics?: MiniMetricItem[];
  periodOptions?: { value: string; label: string }[];
  periodValue?: string;
  onPeriodChange?: (value: string) => void;
  chart?: ReactNode;
  action?: ReactNode;
};

export function AnalyticsCard({
  title,
  miniMetrics = [],
  periodOptions,
  periodValue,
  onPeriodChange,
  chart,
  action,
}: AnalyticsCardProps) {
  return (
    <div className="glass-card flex flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-2">
          {periodOptions?.length && onPeriodChange && periodValue != null ? (
            <select
              value={periodValue}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 text-sm text-white outline-none focus:border-[var(--accent-blue)]"
            >
              {periodOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : null}
          {action}
        </div>
      </div>
      {miniMetrics.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 border-b border-[var(--border-color)] px-5 py-4">
          {miniMetrics.map((m, i) => (
            <div key={i}>
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {m.label}
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{m.value}</p>
              {m.comparison && (
                <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{m.comparison}</p>
              )}
            </div>
          ))}
        </div>
      ) : null}
      <div className="min-h-[280px] flex-1 p-5">{chart}</div>
    </div>
  );
}
