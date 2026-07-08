"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Coins, ChevronRight, Users, User } from "lucide-react";

type PoolItem = {
  id: number;
  partnerId: number;
  partnerName: string;
  totalAmount: string;
  targetType: string;
  allocatedTotal: string;
  remainder: string;
  createdAt: string;
  distributedAt: string | null;
};

type ListResponse = {
  pools: PoolItem[];
  total: number;
  limit: number;
  offset: number;
};

export default function AdminCreditsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/credit-pools?limit=50", { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load credit pools");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPools();
  }, [fetchPools]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Credits</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Create pools and distribute credits evenly to teams or participants. Each credit is a redeemable link.
          </p>
        </div>
        <Link
          href="/admin/dashboard/credits/new"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-blue)]/50 bg-[var(--accent-blue)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20"
        >
          <Plus className="h-4 w-4" />
          Create pool
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : data && data.pools.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          No credit pools yet. Create one to distribute credits.
        </div>
      ) : data ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Target</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Allocated</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-[var(--text-muted)]">Remainder</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-[var(--text-muted)]">Created</th>
                <th className="px-6 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {data.pools.map((pool) => (
                <tr key={pool.id} className="hover:bg-[var(--bg-secondary)]/30">
                  <td className="px-6 py-4 text-white font-medium">{pool.partnerName}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
                      {pool.targetType === "team" ? (
                        <><Users className="h-4 w-4" /> Teams</>
                      ) : (
                        <><User className="h-4 w-4" /> Participants</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white">{pool.totalAmount}</td>
                  <td className="px-6 py-4 text-right text-[var(--text-secondary)]">{pool.allocatedTotal}</td>
                  <td className="px-6 py-4 text-right text-[var(--text-muted)]">{pool.remainder}</td>
                  <td className="px-6 py-4 text-sm text-[var(--text-muted)]">
                    {new Date(pool.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/dashboard/credits/${pool.id}`}
                      className="inline-flex items-center text-[var(--accent-blue)] hover:underline"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
