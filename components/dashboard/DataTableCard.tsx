"use client";

import { type ReactNode } from "react";

type DataTableCardProps = {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  toolbarRight?: ReactNode;
  table?: ReactNode;
  pagination?: ReactNode;
  action?: ReactNode;
};

export function DataTableCard({
  title,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  toolbarRight,
  table,
  pagination,
  action,
}: DataTableCardProps) {
  return (
    <div className="glass-card flex flex-col overflow-hidden rounded-xl">
      <div className="flex flex-col gap-4 border-b border-[var(--border-color)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {action}
      </div>
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        {onSearchChange ? (
          <div className="relative flex-1 sm:min-w-[200px] sm:max-w-sm">
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] pl-9 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)]"
            />
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        ) : null}
        <div className="flex items-center gap-2">{toolbarRight}</div>
      </div>
      <div className="min-h-[200px] overflow-x-auto px-5 pb-5">{table}</div>
      {pagination ? (
        <div className="border-t border-[var(--border-color)] px-5 py-3">{pagination}</div>
      ) : null}
    </div>
  );
}
