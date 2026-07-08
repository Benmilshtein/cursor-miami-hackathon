"use client";

import { useEffect, useState } from "react";
import { Lock, Unlock, Trophy, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminRankingPage() {
  const [finalized, setFinalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings/ranking-finalized", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) setFinalized(data.data.finalized);
      })
      .catch(() => setError("Failed to load ranking status."))
      .finally(() => setLoading(false));
  }, []);

  async function toggleFinalized() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/ranking-finalized", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalized: !finalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Failed to update");
      setFinalized(data.data.finalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 text-[var(--text-muted)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Ranking</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Publish results to make the ranking visible to the public and lock judge evaluations.
        </p>
      </div>

      <div className={`rounded-xl border p-6 ${
        finalized
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-[var(--border-color)] bg-[var(--card-bg)]"
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
              finalized ? "bg-amber-500/20" : "bg-white/5"
            }`}>
              {finalized
                ? <Lock className="h-6 w-6 text-amber-400" />
                : <Unlock className="h-6 w-6 text-[var(--text-muted)]" />}
            </div>
            <div>
              <h2 className="font-semibold text-white">
                {finalized ? "Results are published" : "Results are hidden"}
              </h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {finalized
                  ? "Scores are locked. Judges cannot submit or change evaluations. The ranking page is visible to the public."
                  : "The ranking page shows nothing to the public. Judges can still submit and update evaluations."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleFinalized}
            disabled={saving}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              finalized
                ? "border border-[var(--border-color)] bg-[var(--card-bg)] text-white hover:bg-[var(--bg-secondary)]"
                : "bg-amber-500 text-black hover:bg-amber-400"
            } disabled:opacity-50`}
          >
            {saving
              ? "Saving…"
              : finalized
                ? "Unpublish"
                : "Publish results"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <Link
        href="/ranking"
        className="inline-flex items-center gap-2 text-sm text-[var(--accent-blue)] hover:underline"
      >
        <Trophy className="h-4 w-4" />
        View public ranking page
      </Link>
    </div>
  );
}
