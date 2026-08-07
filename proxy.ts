import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { updateSession } from "@/lib/supabase/middleware";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import {
  dashboardPathForRole,
  isStaffPortalRole,
  requiresParticipantOnboarding,
} from "@/lib/auth/roles";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/profile",
  "/screening",
  "/staff",
  "/admin",
  "/scoring",
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

/** Pages under protected prefixes that must stay reachable without the gate:
 * login pages, and /staff/join (invite-accept flow used by not-yet-staff users). */
function isGatingExempt(pathname: string): boolean {
  return (
    matchesPrefix(pathname, "/admin/login") ||
    matchesPrefix(pathname, "/staff/login") ||
    matchesPrefix(pathname, "/staff/join")
  );
}

function loginPathFor(pathname: string): string {
  if (matchesPrefix(pathname, "/admin")) return "/admin/login";
  if (matchesPrefix(pathname, "/staff") || matchesPrefix(pathname, "/scoring")) {
    return "/staff/login";
  }
  return "/register";
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  try {
    const { response, authUser } = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (!isProtectedPath(pathname) || isGatingExempt(pathname)) {
      return response;
    }

    if (!authUser) {
      return redirectTo(request, loginPathFor(pathname));
    }

    // Missing profile row (trigger gap) degrades to a not-onboarded participant,
    // matching getOptionalSessionUser's fallback; the row self-heals on the
    // first server request.
    const [profile] = await db
      .select({ role: user.role, onboardingCompletedAt: user.onboardingCompletedAt })
      .from(user)
      .where(eq(user.id, authUser.id))
      .limit(1);
    const role = profile?.role ?? "participant";
    const onboarded = profile?.onboardingCompletedAt != null;

    let target: string | null = null;
    if (matchesPrefix(pathname, "/admin")) {
      if (role !== "super_admin") target = dashboardPathForRole(role);
    } else if (matchesPrefix(pathname, "/scoring")) {
      // Miami Scoring System: judges + super admins only.
      if (role !== "judge" && role !== "super_admin") target = dashboardPathForRole(role);
    } else if (matchesPrefix(pathname, "/staff")) {
      if (!isStaffPortalRole(role)) target = dashboardPathForRole(role);
    } else if (matchesPrefix(pathname, "/onboarding")) {
      if (!requiresParticipantOnboarding(role) || onboarded) {
        target = dashboardPathForRole(role);
      }
    } else if (matchesPrefix(pathname, "/dashboard")) {
      if (isStaffPortalRole(role)) target = "/staff";
      else if (requiresParticipantOnboarding(role) && !onboarded) target = "/onboarding";
    }

    if (target && target !== pathname) {
      return redirectTo(request, target);
    }
    return response;
  } catch (error) {
    // Fail open: a Supabase/DB/env hiccup should degrade to an ungated request
    // rather than 500 every route (MIDDLEWARE_INVOCATION_FAILED). Client-side
    // gates remain as defense in depth.
    console.error("proxy failed:", error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets:
     * - _next/static, _next/image
     * - favicon.ico and common image extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
