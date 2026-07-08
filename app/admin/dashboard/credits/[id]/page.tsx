"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  BookOpen,
  Copy,
  Download,
  Loader2,
  Plus,
  Share2,
  Upload,
} from "lucide-react";

type Pool = {
  id: number;
  partnerId: number;
  partnerName: string;
  totalAmount: string;
  targetType: string;
  distributionType: string;
  generalCreditUrl: string | null;
  allocatedTotal: string;
  remainder: string;
  pendingLinkCount: number;
  createdAt: string;
  createdByUserId: string | null;
  distributedAt: string | null;
  distributedByUserId: string | null;
};

type Preview = {
  poolId: number;
  targetType: string;
  distributionType?: string;
  totalAmount: number;
  alreadyAllocated: number;
  remainder: number;
  recipientCount: number;
  amountPerRecipient: number;
  remainderLeftInPool: number;
  pendingLinkCount?: number;
  availablePending?: number;
  targetedPending?: number;
};

type LinkItem = {
  id: number;
  shortCode: string;
  url: string;
  fullUrl: string | null;
  createdAt: string;
  participantUserId: string | null;
  participantEmail: string | null;
  claimedAt: string | null;
};

type UploadResult = {
  batchId: string;
  rawRowCount: number;
  dedupedRowCount: number;
  stagedRows: number;
  pendingLinkCount: number;
};

type RecipientTeam = { id: number; name: string; memberCount: number };
type RecipientParticipant = {
  id: string;
  name: string | null;
  email: string;
  teamId: number | null;
};
type DisburseResult = { assigned: number; pendingLeft: number; recipientsWithoutLink: number };

function distributionLabel(t: string): string {
  switch (t) {
    case "even":
      return "Even split";
    case "excel_unique":
      return "Unique links (Excel)";
    case "general_link":
      return "General link";
    default:
      return t;
  }
}

export default function AdminCreditPoolDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [pool, setPool] = useState<Pool | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [linksLoading, setLinksLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  // Disburse panel
  const [teams, setTeams] = useState<RecipientTeam[]>([]);
  const [participants, setParticipants] = useState<RecipientParticipant[]>([]);
  const [recipientsLoaded, setRecipientsLoaded] = useState(false);
  const [disburseMode, setDisburseMode] = useState<"teams" | "participants">("teams");
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<number>>(new Set());
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [participantSearch, setParticipantSearch] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [disburseResult, setDisburseResult] = useState<DisburseResult | null>(null);
  const [generalUrl, setGeneralUrl] = useState("");
  const [savingGeneralUrl, setSavingGeneralUrl] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEntries, setAuditEntries] = useState<{ action: string; createdAt: string; details: unknown }[]>(
    [],
  );
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchPool = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load");
      setPool(json.data);
      if (json.data.generalCreditUrl) setGeneralUrl(json.data.generalCreditUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pool");
      setPool(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPreview = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/distribute`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) setPreview(json.data);
    } catch {
      // ignore
    }
  }, [id]);

  const fetchLinks = useCallback(async () => {
    if (!id) return;
    setLinksLoading(true);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/links`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data?.links) setLinks(json.data.links);
    } catch {
      // ignore
    } finally {
      setLinksLoading(false);
    }
  }, [id]);

  const fetchAudit = useCallback(async () => {
    if (!id) return;
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/audit-log`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data?.entries) setAuditEntries(json.data.entries);
    } catch {
      // ignore
    } finally {
      setAuditLoading(false);
    }
  }, [id]);

  const fetchRecipients = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/recipients`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && json.data) {
        setTeams(json.data.teams ?? []);
        setParticipants(json.data.participants ?? []);
        setRecipientsLoaded(true);
      }
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    void fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    if (pool) {
      void fetchPreview();
    }
  }, [pool, fetchPreview]);

  useEffect(() => {
    if (pool?.distributionType === "excel_unique" && !recipientsLoaded) {
      void fetchRecipients();
    }
  }, [pool, recipientsLoaded, fetchRecipients]);

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(addAmount, 10);
    if (!Number.isInteger(amount) || amount < 1) {
      setError("Enter a positive integer.");
      return;
    }
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ addAmount: amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to add credits");
      setAddAmount("");
      await fetchPool();
      await fetchPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add credits");
    } finally {
      setAdding(false);
    }
  };

  const handleSaveGeneralUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneralUrl(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ generalCreditUrl: generalUrl.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to save URL");
      await fetchPool();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save URL");
    } finally {
      setSavingGeneralUrl(false);
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/distribute`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to distribute");
      await fetchPool();
      await fetchPreview();
      await fetchLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to distribute");
    } finally {
      setDistributing(false);
    }
  };

  const handleDisburse = async () => {
    const body =
      disburseMode === "teams"
        ? { scope: "teams", teamIds: [...selectedTeamIds] }
        : { scope: "participants", userIds: [...selectedUserIds] };
    setDisbursing(true);
    setError(null);
    setDisburseResult(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/distribute-excel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to disburse");
      setDisburseResult(json.data);
      setSelectedTeamIds(new Set());
      setSelectedUserIds(new Set());
      await fetchPool();
      await fetchPreview();
      await fetchLinks();
      setUploadResult(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to disburse");
    } finally {
      setDisbursing(false);
    }
  };

  const copyAllLinks = () => {
    const text = links.map((l) => l.fullUrl ?? l.url).join("\n");
    void navigator.clipboard.writeText(text);
  };

  const handleDownloadTemplate = async () => {
    if (downloadingTemplate) return;
    setError(null);
    setDownloadingTemplate(true);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/eligible-template`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "eligible-participants.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download template");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUploadExcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || uploading) return;
    setError(null);
    setUploadResult(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", uploadFile);
      const res = await fetch(`/api/admin/credit-pools/${id}/upload-links`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Upload failed");
      if (json.success && json.data) {
        setUploadResult(json.data);
        setUploadFile(null);
        await fetchPool();
        await fetchPreview();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRevoke = async (linkId: number) => {
    if (!confirm("Revoke this link? Participants will no longer see it.")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "revoke" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Revoke failed");
      await fetchLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    }
  };

  const handleReassign = async (linkId: number) => {
    const newUserId = window.prompt("Reassign to user id (exact platform id):");
    if (!newUserId?.trim()) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/credit-pools/${id}/links/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "reassign", newUserId: newUserId.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Reassign failed");
      await fetchLinks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reassign failed");
    }
  };

  if (!id) return null;
  if (loading || !pool) {
    return (
      <div className="space-y-6">
        <Link href="/admin/dashboard/credits" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]">
          <ArrowLeft className="h-4 w-4" />
          Back to Credits
        </Link>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          {loading ? "Loading…" : "Pool not found."}
        </div>
      </div>
    );
  }

  const isExcel = pool.distributionType === "excel_unique";
  const isGeneral = pool.distributionType === "general_link";
  const isEven = pool.distributionType === "even";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/credits"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Credits
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pool #{pool.id}</h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            {pool.partnerName} · {pool.targetType === "team" ? "Teams" : "Participants"} ·{" "}
            <span className="text-[var(--accent-blue)]">{distributionLabel(pool.distributionType)}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Total</p>
          <p className="mt-1 text-xl font-semibold text-white">{pool.totalAmount}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Allocated</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-secondary)]">{pool.allocatedTotal}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
          <p className="text-sm text-[var(--text-muted)]">Remainder</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-muted)]">{pool.remainder}</p>
        </div>
        {isExcel && (
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <p className="text-sm text-[var(--text-muted)]">Pending (staged)</p>
            <p className="mt-1 text-xl font-semibold text-amber-200">{pool.pendingLinkCount}</p>
          </div>
        )}
      </div>

      {/* Add credits */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add credits to pool
        </h2>
        <form onSubmit={handleAddCredits} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="sr-only">Amount to add</label>
            <input
              type="number"
              min={1}
              step={1}
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Amount"
              className="w-32 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !addAmount.trim()}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add"}
          </button>
        </form>
      </div>

      {isGeneral && pool.targetType === "participant" && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <h2 className="font-semibold text-white">General sponsor URL</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            One link shown to every participant after distribution. Must be https.
          </p>
          <form onSubmit={handleSaveGeneralUrl} className="mt-4 flex flex-wrap items-end gap-3">
            <input
              type="url"
              value={generalUrl}
              onChange={(e) => setGeneralUrl(e.target.value)}
              placeholder="https://…"
              className="min-w-[240px] flex-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingGeneralUrl}
              className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
            >
              {savingGeneralUrl ? "Saving…" : "Save URL"}
            </button>
          </form>
        </div>
      )}

      {/* Even / general distribute */}
      {(isEven || isGeneral) && (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Distribute
          </h2>
          {preview && (
            <div className="mt-4 rounded-lg bg-[var(--bg-secondary)]/80 p-4 text-sm">
              <p className="text-[var(--text-secondary)]">
                Recipients: <span className="text-white font-medium">{preview.recipientCount}</span>{" "}
                {preview.targetType === "team" ? "teams" : "participants"}
              </p>
              <p className="mt-1 text-[var(--text-secondary)]">
                Amount per recipient:{" "}
                <span className="text-white font-medium">{preview.amountPerRecipient}</span> links
              </p>
              <p className="mt-1 text-[var(--text-muted)]">
                Remainder to distribute: {preview.remainder} · After distribution, {preview.remainderLeftInPool}{" "}
                will stay in pool
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => void handleDistribute()}
            disabled={
              distributing ||
              !preview ||
              preview.recipientCount === 0 ||
              (isGeneral
                ? false
                : preview.remainder <= 0 || preview.amountPerRecipient <= 0)
            }
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {distributing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {distributing ? "Distributing…" : "Distribute now"}
          </button>
        </div>
      )}

      {/* Unique links: upload + disburse */}
      {isExcel && (
        <>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload credit links
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Upload a CSV or Excel file containing the credit URLs (one per row). A{" "}
              <strong>url</strong>/<strong>link</strong> header is optional and <strong>user_id</strong>{" "}
              is not required. URLs must start with http(s). Duplicate URLs are deduped. Links are staged
              until you disburse them below.
            </p>
            <button
              type="button"
              onClick={() => void handleDownloadTemplate()}
              disabled={downloadingTemplate}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-50"
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadingTemplate ? "Preparing…" : "Download participant list (optional)"}
            </button>
            {uploadResult && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Staged <strong>{uploadResult.stagedRows}</strong> links. Pending in queue:{" "}
                <strong>{uploadResult.pendingLinkCount}</strong>.
              </div>
            )}
            <form onSubmit={handleUploadExcel} className="mt-4 flex flex-wrap items-center gap-3">
              <label className="cursor-pointer">
                <span className="sr-only">Choose CSV or Excel file</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    setUploadFile(f ?? null);
                    setUploadResult(null);
                  }}
                  className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent-blue)]/20 file:px-4 file:py-2 file:text-[var(--accent-blue)]"
                />
              </label>
              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload to staging"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Disburse links
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Each selected recipient gets one unique link in their dashboard.{" "}
              <span className="text-[var(--text-secondary)]">
                {preview?.availablePending ?? pool.pendingLinkCount} available
              </span>{" "}
              now. Already-assigned people are skipped; re-run as more people arrive.
            </p>

            <div className="mt-4 flex gap-2">
              {(["teams", "participants"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDisburseMode(m);
                    setDisburseResult(null);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    disburseMode === m
                      ? "bg-[var(--accent-blue)] text-white"
                      : "border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  {m === "teams" ? "Selected teams" : "Selected participants"}
                </button>
              ))}
            </div>

            {disburseMode === "teams" ? (
              <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-[var(--border-color)]">
                {teams.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[var(--text-muted)]">
                    {recipientsLoaded ? "No active teams yet." : "Loading teams…"}
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--border-color)]">
                    {teams.map((tm) => (
                      <li key={tm.id} className="px-4 py-2.5">
                        <label className="flex cursor-pointer items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedTeamIds.has(tm.id)}
                            onChange={(e) => {
                              setSelectedTeamIds((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(tm.id);
                                else next.delete(tm.id);
                                return next;
                              });
                            }}
                          />
                          <span className="text-white">{tm.name}</span>
                          <span className="text-xs text-[var(--text-muted)]">
                            {tm.memberCount} member{tm.memberCount === 1 ? "" : "s"}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="mb-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
                />
                <div className="max-h-64 overflow-y-auto rounded-lg border border-[var(--border-color)]">
                  {participants.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[var(--text-muted)]">
                      {recipientsLoaded ? "No participants yet." : "Loading participants…"}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--border-color)]">
                      {participants
                        .filter((p) => {
                          const q = participantSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            (p.name ?? "").toLowerCase().includes(q) ||
                            p.email.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 200)
                        .map((p) => (
                          <li key={p.id} className="px-4 py-2.5">
                            <label className="flex cursor-pointer items-center gap-3 text-sm">
                              <input
                                type="checkbox"
                                checked={selectedUserIds.has(p.id)}
                                onChange={(e) => {
                                  setSelectedUserIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(p.id);
                                    else next.delete(p.id);
                                    return next;
                                  });
                                }}
                              />
                              <span className="text-white">{p.name ?? p.email}</span>
                              <span className="text-xs text-[var(--text-muted)]">{p.email}</span>
                            </label>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {disburseResult && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Assigned <strong>{disburseResult.assigned}</strong> link
                {disburseResult.assigned === 1 ? "" : "s"}. {disburseResult.pendingLeft} still available.
                {disburseResult.recipientsWithoutLink > 0 && (
                  <span>
                    {" "}
                    {disburseResult.recipientsWithoutLink} selected recipient
                    {disburseResult.recipientsWithoutLink === 1 ? "" : "s"} got nothing (ran out of
                    links).
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleDisburse()}
              disabled={
                disbursing ||
                (disburseMode === "teams"
                  ? selectedTeamIds.size === 0
                  : selectedUserIds.size === 0)
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {disbursing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
              {disbursing ? "Disbursing…" : "Disburse links"}
            </button>
          </div>
        </>
      )}

      {/* Audit log */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <button
          type="button"
          onClick={() => {
            setAuditOpen(!auditOpen);
            if (!auditOpen && auditEntries.length === 0) void fetchAudit();
          }}
          className="flex w-full items-center justify-between gap-2 text-left font-semibold text-white"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Audit log
          </span>
          <span className="text-sm text-[var(--text-muted)]">{auditOpen ? "Hide" : "Show"}</span>
        </button>
        {auditOpen && (
          <div className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-4">
            {auditLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading…</p>
            ) : auditEntries.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No entries yet.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto text-sm font-mono text-[var(--text-secondary)]">
                {auditEntries.map((e, i) => (
                  <li key={`${e.action}-${String(e.createdAt)}-${i}`} className="border-b border-[var(--border-color)]/50 pb-2">
                    <span className="text-[var(--text-muted)]">{e.createdAt}</span> · {e.action}
                    {e.details != null && (
                      <pre className="mt-1 whitespace-pre-wrap break-all text-xs text-[var(--text-muted)]">
                        {JSON.stringify(e.details, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Redemption links */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-semibold text-white">Redeem links</h2>
          {links.length > 0 && (
            <button
              type="button"
              onClick={copyAllLinks}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              <Copy className="h-4 w-4" />
              Copy all URLs
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Short links redirect to sponsor URLs when present. Use Revoke or Reassign as needed.
        </p>
        <button
          type="button"
          onClick={() => void fetchLinks()}
          disabled={linksLoading}
          className="mt-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 disabled:opacity-50"
        >
          {linksLoading ? "Loading…" : links.length > 0 ? "Refresh links" : "Load links"}
        </button>
        {links.length > 0 && (
          <div className="mt-4 max-h-96 overflow-y-auto rounded-lg border border-[var(--border-color)]">
            <ul className="divide-y divide-[var(--border-color)]">
              {links.slice(0, 200).map((l) => (
                <li key={l.id} className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-mono text-[var(--text-secondary)] break-all">{l.fullUrl ?? l.url}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {l.participantEmail ?? l.participantUserId ?? "—"} · claimed:{" "}
                        {l.claimedAt ? "yes" : "no"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReassign(l.id)}
                        className="text-xs text-[var(--accent-blue)] hover:underline"
                      >
                        Reassign
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRevoke(l.id)}
                        className="inline-flex items-center gap-1 text-xs text-red-300 hover:underline"
                      >
                        <Ban className="h-3 w-3" />
                        Revoke
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {links.length > 200 && (
              <p className="px-4 py-2 text-xs text-[var(--text-muted)]">
                Showing first 200 of {links.length} links.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
