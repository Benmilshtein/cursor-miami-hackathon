import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";

type OnboardingBody = {
  experienceLevel?: unknown;
  matchNumber?: unknown;
  builtApp?: unknown;
  vibeCode?: unknown;
  teamPreference?: unknown;
};

function parseIntInRange(value: unknown, min: number, max: number, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new AppError(400, "INVALID_INPUT", `${field} must be an integer between ${min} and ${max}.`);
  }
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<OnboardingBody>(request);

    const experienceLevel = parseIntInRange(body.experienceLevel, 1, 3, "experienceLevel");
    const matchNumber = parseIntInRange(body.matchNumber, 1, 4, "matchNumber");

    if (typeof body.builtApp !== "boolean") {
      throw new AppError(400, "INVALID_INPUT", "builtApp must be a boolean.");
    }
    if (typeof body.vibeCode !== "boolean") {
      throw new AppError(400, "INVALID_INPUT", "vibeCode must be a boolean.");
    }
    if (body.teamPreference !== "auto_match" && body.teamPreference !== "self_form") {
      throw new AppError(400, "INVALID_INPUT", "teamPreference must be auto_match or self_form.");
    }

    const updated = await db
      .update(user)
      .set({
        experienceLevel,
        matchNumber,
        builtApp: body.builtApp,
        vibeCode: body.vibeCode,
        teamPreference: body.teamPreference,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(user.id, actor.id))
      .returning({ id: user.id });

    if (updated.length === 0) {
      // No profile row to update — surface it instead of reporting success
      // that never persisted (this is what caused the onboarding redirect loop).
      throw new AppError(
        500,
        "PROFILE_MISSING",
        "Your profile could not be found. Please sign out and back in, then try again.",
      );
    }

    return jsonSuccess({ teamPreference: body.teamPreference });
  } catch (error) {
    return toErrorResponse(error);
  }
}
