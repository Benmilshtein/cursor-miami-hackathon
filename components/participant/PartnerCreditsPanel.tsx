"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Gift, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { Button } from "@/components/ui";

export type TeamScreeningStatus = "draft" | "submitted" | "approved" | "rejected";

export type PartnerCreditsContext = {
  hasTeam: boolean;
  screeningStatus?: TeamScreeningStatus | null;
};

type CreditItem = {
  allocationId: number;
  poolId: number;
  partnerName: string;
  distributionType: string;
  status: string;
  generalCreditUrl: string | null;
  links: {
    id: number;
    shortCode: string;
    fullUrl: string | null;
    claimedAt: string | null;
    appRedeemPath: string;
  }[];
};

type PartnerCreditsPanelProps = {
  creditsContext?: PartnerCreditsContext;
};

type PartnerCreditsEmptyKey =
  | "emptyNoTeam"
  | "emptyDraft"
  | "emptySubmitted"
  | "emptyRejected"
  | "emptyApprovedWaiting";

function emptyMessageKey(ctx: PartnerCreditsContext | undefined): PartnerCreditsEmptyKey {
  if (!ctx || !ctx.hasTeam) {
    return "emptyNoTeam";
  }
  const s = ctx.screeningStatus;
  if (s === "submitted") return "emptySubmitted";
  if (s === "rejected") return "emptyRejected";
  if (s === "approved") return "emptyApprovedWaiting";
  return "emptyDraft";
}

export function PartnerCreditsPanel({ creditsContext }: PartnerCreditsPanelProps) {
  const { t } = useLanguage();
  const [credits, setCredits] = useState<CreditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const emptyKey = useMemo(() => emptyMessageKey(creditsContext), [creditsContext]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load credits");
      if (!json.success) throw new Error(json?.error?.message ?? "Failed to load credits");
      setCredits(json.data.credits ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setCredits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleClaim = async (allocationId: number) => {
    setClaimingId(allocationId);
    setError(null);
    try {
      const res = await fetch("/api/credits/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Claim failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("partnerCredits", "loading")}
      </div>
    );
  }

  if (credits.length === 0) {
    return (
      <CardSection title={t("partnerCredits", "title")} subtitle={t("partnerCredits", "emptySubtitle")}>
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{t("partnerCredits", emptyKey)}</p>
      </CardSection>
    );
  }

  return (
    <CardSection title={t("partnerCredits", "title")} subtitle={t("partnerCredits", "subtitle")}>
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <ul className="space-y-4">
        {credits.map((c) => {
          const isGeneral = c.distributionType === "general_link";
          const redeemHref = isGeneral ? c.generalCreditUrl : c.links[0]?.fullUrl ?? c.links[0]?.appRedeemPath;
          const canClaim =
            c.status === "assigned" &&
            (isGeneral ? Boolean(c.generalCreditUrl) : c.links.length > 0);

          return (
            <li
              key={c.allocationId}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/65 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white flex items-center gap-2">
                    <Gift className="h-4 w-4 text-[var(--accent-blue)]" />
                    {c.partnerName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("partnerCredits", "status")}:{" "}
                    <span className="text-[var(--text-secondary)]">{c.status}</span>
                  </p>
                </div>
                {redeemHref && (
                  <a
                    href={redeemHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-[var(--accent-blue)] hover:bg-white/5"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("partnerCredits", "openLink")}
                  </a>
                )}
              </div>
              {canClaim && (
                <div className="mt-4">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={claimingId === c.allocationId}
                    onClick={() => void handleClaim(c.allocationId)}
                    className="gap-2"
                  >
                    {claimingId === c.allocationId ? (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    ) : null}
                    {claimingId === c.allocationId
                      ? t("partnerCredits", "claiming")
                      : t("partnerCredits", "claim")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </CardSection>
  );
}

function CardSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
