"use client";

import { type ReactNode, useState } from "react";
import { Menu, X } from "lucide-react";

type DashboardLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function DashboardLayout({ sidebar, children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[var(--bg-primary)] text-white">
      {/* Desktop: fixed full-height rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden h-full w-64 shrink-0 overflow-hidden lg:block">
        {sidebar}
      </aside>

      {/* Mobile: burger button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/90 text-white shadow-sm backdrop-blur-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile: drawer overlay and panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-[var(--border-color)] bg-[var(--bg-primary)] shadow-xl">
            <div className="sticky top-0 flex justify-end border-b border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-white"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2">{sidebar}</div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 pt-14 lg:pt-0 lg:pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
