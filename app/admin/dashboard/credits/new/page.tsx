"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type Partner = { id: number; name: string; redeemBaseUrl: string | null };

export default function AdminCreditsNewPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState("");
  const [targetType, setTargetType] = useState<"team" | "participant">("participant");
  const [distributionType, setDistributionType] = useState<"even" | "excel_unique" | "general_link">("even");
  const [generalCreditUrl, setGeneralCreditUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/partners", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load partners");
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      const list = json.data.partners ?? [];
      setPartners(list);
      if (list.length > 0) {
        setPartnerId((prev) => (prev ? prev : String(list[0].id)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPartners();
  }, [fetchPartners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount =
      distributionType === "excel_unique" && !totalAmount.trim()
        ? 0
        : parseInt(totalAmount, 10);
    if (distributionType === "excel_unique") {
      if (!Number.isInteger(amount) || amount < 0) {
        setError("Enter a non-negative integer for pool total (or 0).");
        return;
      }
    } else if (!Number.isInteger(amount) || amount < 1) {
      setError("Enter a positive integer for total credits (links).");
      return;
    }
    const pid = parseInt(partnerId, 10);
    if (!pid || !partners.some((p) => p.id === pid)) {
      setError("Select a partner.");
      return;
    }
    if (distributionType === "general_link") {
      const u = generalCreditUrl.trim();
      if (!u.startsWith("http://") && !u.startsWith("https://")) {
        setError("General link pools require a valid https URL.");
        return;
      }
    }
    if ((distributionType === "excel_unique" || distributionType === "general_link") && targetType !== "participant") {
      setError("Excel and general modes require participant target.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/credit-pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          partnerId: pid,
          totalAmount: distributionType === "excel_unique" ? 0 : amount,
          targetType,
          distributionType,
          generalCreditUrl:
            distributionType === "general_link" ? generalCreditUrl.trim() : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create pool");
      router.push(`/admin/dashboard/credits/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create pool");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/credits"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credits
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-white">Create credit pool</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Set total amount and target (teams or participants). Then distribute from the pool page.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading partners…
        </div>
      ) : partners.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          <p>No partners yet.</p>
          <Link href="/admin/dashboard/partners" className="mt-2 inline-block text-[var(--accent-blue)] hover:underline">
            Add a partner first
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-6 max-w-lg"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Partner</label>
            <select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            >
              <option value="">Select partner</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Distribution mode
            </label>
            <select
              value={distributionType}
              onChange={(e) =>
                setDistributionType(e.target.value as "even" | "excel_unique" | "general_link")
              }
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white focus:border-[var(--accent-blue)] focus:outline-none"
            >
              <option value="even">Even split (generated short links)</option>
              <option value="excel_unique">Unique per user (Excel: user id + URL)</option>
              <option value="general_link">General (one URL for all participants)</option>
            </select>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Cursor-style unique credits use Excel. Other sponsors often use a single general link.
            </p>
          </div>
          {distributionType === "general_link" && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                General credit URL (https)
              </label>
              <input
                type="url"
                value={generalCreditUrl}
                onChange={(e) => setGeneralCreditUrl(e.target.value)}
                placeholder="https://…"
                required
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Total credits (number of redeemable links)
            </label>
            <input
              type="number"
              min={distributionType === "excel_unique" ? 0 : 1}
              step={1}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={distributionType === "excel_unique" ? "0 (optional)" : "e.g. 100"}
              required={distributionType !== "excel_unique"}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2.5 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Distribute to</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="team"
                  checked={targetType === "team"}
                  onChange={() => setTargetType("team")}
                  className="rounded-full border-[var(--border-color)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                />
                <span className="text-white">Teams</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="participant"
                  checked={targetType === "participant"}
                  onChange={() => setTargetType("participant")}
                  className="rounded-full border-[var(--border-color)] text-[var(--accent-blue)] focus:ring-[var(--accent-blue)]"
                />
                <span className="text-white">Participants</span>
                <span className="text-xs text-[var(--text-muted)]">(role = participant only)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || !partnerId || !totalAmount.trim()}
              className="rounded-lg bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create pool"}
            </button>
            <Link
              href="/admin/dashboard/credits"
              className="rounded-lg border border-[var(--border-color)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
