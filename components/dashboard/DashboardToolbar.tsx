"use client";

import { type ReactNode } from "react";

type DashboardToolbarProps = {
  left?: ReactNode;
  status?: string;
  right?: ReactNode;
};

export function DashboardToolbar({ left, status, right }: DashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">{left}</div>
      <div className="flex flex-shrink-0 items-center gap-3">
        {status ? (
          <span className="text-sm text-[var(--text-muted)]">{status}</span>
        ) : null}
        {right}
      </div>
    </div>
  );
}
