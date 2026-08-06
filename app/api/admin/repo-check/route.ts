import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  getHackathonStartAt,
  listRepoChecks,
  runRepoCheck,
  runRepoCheckForAllTeams,
  setHackathonStartAt,
} from "@/lib/judging/repo-check";

export const dynamic = "force-dynamic";
// The all-teams sweep talks to GitHub once per team; give it room.
export const maxDuration = 300;

/** Current cached results plus the configured hackathon start time. */
export async function GET() {
  try {
    await requireSuperAdminUser();
    const [checks, startAt] = await Promise.all([listRepoChecks(), getHackathonStartAt()]);
    return jsonSuccess({ checks, hackathonStartAt: startAt?.toISOString() ?? null });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Re-run the check for one team (`{ teamId }`) or every active team. */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser();
    // An empty body means "check every team", so a parse failure is not an error.
    const body: { teamId?: unknown } = await parseJsonBody<{ teamId?: unknown }>(
      request,
    ).catch(() => ({}));

    if (body.teamId !== undefined) {
      const teamId = Number(body.teamId);
      if (!Number.isInteger(teamId) || teamId <= 0) {
        throw new AppError(400, "INVALID_INPUT", "Invalid team ID.");
      }
      await runRepoCheck(teamId);
    } else {
      await runRepoCheckForAllTeams();
    }

    // Re-read rather than returning the run results directly: `listRepoChecks`
    // is the one shape the UI knows (team names, `details` as a JSON string).
    return jsonSuccess({ checks: await listRepoChecks() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Set (or clear with `null`) T0, the hackathon start time the window runs from. */
export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdminUser();
    const body = await parseJsonBody<{ hackathonStartAt?: unknown }>(request);
    const raw = body.hackathonStartAt;

    if (raw == null || raw === "") {
      await setHackathonStartAt(null);
      return jsonSuccess({ hackathonStartAt: null });
    }

    const startAt = new Date(String(raw));
    if (Number.isNaN(startAt.getTime())) {
      throw new AppError(400, "INVALID_INPUT", "Enter a valid date and time.");
    }

    await setHackathonStartAt(startAt);
    return jsonSuccess({ hackathonStartAt: startAt.toISOString() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
