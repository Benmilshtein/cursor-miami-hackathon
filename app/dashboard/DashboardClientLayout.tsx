"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Access = {
  onboardingCompleted: boolean;
  teamId: number | null;
  screeningStatus: string | null;
  screeningPhase: string;
  canAccessDashboard: boolean;
  isSuperAdmin: boolean;
  staffPortal: boolean;
};

export default function DashboardClientLayout({
  children,
}: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const [access, setAccess] = useState<Access | null>(null);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    if (sessionPending || !session?.user) {
      if (!sessionPending && !session) {
        router.replace("/register");
      }
      return;
    }
    let ignore = false;
    fetch("/api/me/access", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (ignore || !data?.success) return;
        setAccess(data.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) setCheckDone(true);
      });
    return () => {
      ignore = true;
    };
  }, [sessionPending, session, router]);

  useEffect(() => {
    if (!checkDone || !access || pathname !== "/dashboard") return;
    if (access.staffPortal) {
      router.replace("/staff");
      return;
    }
    if (!access.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
  }, [access, checkDone, pathname, router]);

  if (sessionPending || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-muted)]">Loading…</div>
      </div>
    );
  }

  if (pathname === "/dashboard" && checkDone && access?.staffPortal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-muted)]">Redirecting…</div>
      </div>
    );
  }

  return <>{children}</>;
}
