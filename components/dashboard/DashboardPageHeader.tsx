"use client";

import { type ReactNode } from "react";

type DashboardPageHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  notificationCount?: number;
  onNotificationClick?: () => void;
  actionLabel?: string;
  onActionClick?: () => void;
};

export function DashboardPageHeader({
  title,
  subtitle,
  right,
  searchPlaceholder = "Search...",
  onSearch,
  searchValue = "",
  notificationCount = 0,
  onNotificationClick,
  actionLabel,
  onActionClick,
}: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
      </div>

      {right ?? (
        <div className="flex flex-shrink-0 items-center gap-3">
          {onSearch ? (
            <div className="relative flex-1 sm:min-w-[200px] sm:max-w-md">
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
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
          {onNotificationClick ? (
            <button
              type="button"
              onClick={onNotificationClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-tertiary)] hover:text-white"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-blue)] px-1 text-[10px] font-medium text-white">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              ) : null}
            </button>
          ) : null}
          {actionLabel && onActionClick ? (
            <button
              type="button"
              onClick={onActionClick}
              className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-sm font-medium text-white transition-colors hover:bg-[var(--bg-tertiary)]"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
}
