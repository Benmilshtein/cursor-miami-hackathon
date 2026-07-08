import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import {
  canBypassParticipantScreening,
  isStaffPortalRole,
  requiresParticipantOnboarding,
} from "@/lib/auth/roles";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getScreeningPhase } from "@/lib/screening-phase";

/** Returns onboarding and screening state for dashboard gate. */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const [u] = await db
      .select({
        onboardingCompletedAt: user.onboardingCompletedAt,
        teamId: user.teamId,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, actor.id))
      .limit(1);
    const role = u?.role ?? "participant";
    const staffPortal = isStaffPortalRole(role);
    const participantOnboardingDone = !!u?.onboardingCompletedAt;
    const onboardingCompleted = requiresParticipantOnboarding(role)
      ? participantOnboardingDone
      : true;
    const teamId = u?.teamId ?? null;
    const isSuperAdmin = role === "super_admin";
    const screeningPhase = await getScreeningPhase();

    let screeningStatus: string | null = null;
    if (teamId) {
      const [t] = await db
        .select({ screeningStatus: team.screeningStatus })
        .from(team)
        .where(eq(team.id, teamId))
        .limit(1);
      screeningStatus = t?.screeningStatus ?? null;
    }

    let canAccessDashboard = false;
    if (staffPortal) {
      canAccessDashboard = false;
    } else if (canBypassParticipantScreening(role)) {
      canAccessDashboard = true;
    } else {
      canAccessDashboard = participantOnboardingDone;
    }

    return jsonSuccess({
      onboardingCompleted,
      teamId,
      screeningStatus,
      screeningPhase,
      canAccessDashboard,
      isSuperAdmin,
      staffPortal,
      role,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
