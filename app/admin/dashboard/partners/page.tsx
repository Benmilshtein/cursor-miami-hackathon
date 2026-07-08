"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Building2, Link2 } from "lucide-react";

type Partner = {
  id: number;
  name: string;
  redeemBaseUrl: string | null;
  createdAt: string;
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [redeemBaseUrl, setRedeemBaseUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners", { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setPartners(json.data.partners ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load partners");
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPartners();
  }, [fetchPartners]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          redeemBaseUrl: redeemBaseUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create");
      setShowForm(false);
      setName("");
      setRedeemBaseUrl("");
      await fetchPartners();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create partner");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Partners</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Manage partners for credit distribution. Select a partner when creating a credit pool.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--accent-blue)]/50 bg-[var(--accent-blue)]/10 px-4 py-2.5 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20"
        >
          <Plus className="h-4 w-4" />
          Add partner
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4"
        >
          <h2 className="font-semibold text-white">New partner</h2>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme AI, Replit"
              required
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Redeem base URL (optional)
            </label>
            <input
              type="url"
              value={redeemBaseUrl}
              onChange={(e) => setRedeemBaseUrl(e.target.value)}
              placeholder="https://partner.com/redeem"
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              If set, /r/{`{code}`} will redirect to this URL with ?code=
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setName("");
                setRedeemBaseUrl("");
              }}
              className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          No partners yet. Add one to create credit pools.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <ul className="divide-y divide-[var(--border-color)]">
            {partners.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/20">
                  <Building2 className="h-5 w-5 text-[var(--accent-blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{p.name}</p>
                  {p.redeemBaseUrl ? (
                    <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] truncate">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      {p.redeemBaseUrl}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No redirect URL</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
