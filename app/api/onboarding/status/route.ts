import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const [row] = await db
      .select({ onboardingCompletedAt: user.onboardingCompletedAt })
      .from(user)
      .where(eq(user.id, actor.id))
      .limit(1);
    return jsonSuccess({
      onboardingCompleted: !!row?.onboardingCompletedAt,
      onboardingCompletedAt: row?.onboardingCompletedAt ?? null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
