"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { NoiseOverlay } from "@/components/ui";

/**
 * Auth gate for the HCMC Repo Analyzer dashboard.
 * The full judging UI (ported from cursor-hackathon-hcmc-2025) lives at
 * /hackathon-analyzer/ and talks to /api/staff/repo-analyzer/*.
 */
export default function StaffAnalyzePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.replace("/staff/login");
      return;
    }
    const role = (session.user as { role?: string }).role;
    if (role !== "judge" && role !== "mentor" && role !== "super_admin") {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [isPending, session?.user, router]);

  if (isPending || !ready) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <Loader2 className="h-6 w-6 text-[var(--text-muted)] animate-spin" />
        </div>
      </>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <iframe
        title="Ship Night Repo Analyzer"
        src="/hackathon-analyzer/index.html"
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
