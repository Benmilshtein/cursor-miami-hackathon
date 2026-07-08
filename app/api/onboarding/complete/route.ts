import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { requiresParticipantOnboarding } from "@/lib/auth/roles";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const [row] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, actor.id))
      .limit(1);
    if (!requiresParticipantOnboarding(row?.role)) {
      throw new AppError(
        403,
        "FORBIDDEN",
        "Participant onboarding is only for users with the participant role.",
      );
    }
    await db
      .update(user)
      .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, actor.id));
    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
