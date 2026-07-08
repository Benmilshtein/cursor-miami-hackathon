import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { lookupRedemptionByShortCode } from "@/lib/credits/redeem";
import { CopyLinkButton } from "./CopyLinkButton";

type Props = { params: Promise<{ code: string }> };

export default async function RedeemPage({ params }: Props) {
  const { code } = await params;
  const lookup = await lookupRedemptionByShortCode(code);
  if (!lookup.found) notFound();

  const { shortCode, partnerName, redeemBaseUrl, fullUrl } = lookup;

  if (fullUrl) {
    redirect(fullUrl);
  }

  if (redeemBaseUrl) {
    const separator = redeemBaseUrl.includes("?") ? "&" : "?";
    const redirectUrl = `${redeemBaseUrl.replace(/\/$/, "")}${separator}code=${encodeURIComponent(shortCode)}`;
    redirect(redirectUrl);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const fullLink = baseUrl ? `${baseUrl.replace(/\/$/, "")}/r/${shortCode}` : `/r/${shortCode}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-white">Your redeem link</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Use this link to redeem your credit at {partnerName}.
          </p>
        </div>
        <div className="rounded-xl bg-[var(--bg-secondary)]/80 p-4 font-mono text-lg text-center text-white break-all">
          /r/{shortCode}
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)] text-center">
          Full URL: {fullLink}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <CopyLinkButton text={fullLink} />
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:bg-white/10 hover:text-white transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
