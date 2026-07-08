import { toErrorResponse, jsonSuccess, AppError } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { createMentorRequest, cancelMentorRequest, getActiveRequestForTeam } from "@/lib/mentor/service";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const actor = await requireSessionUser(request);
    if (!actor.teamId) {
      throw new AppError(400, "NO_TEAM", "You must be in a team to use mentor requests.");
    }
    const req = await getActiveRequestForTeam(actor.teamId);
    return jsonSuccess({ request: req });
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireSessionUser(request);
    if (!actor.teamId) {
      throw new AppError(400, "NO_TEAM", "You must be in a team to request a mentor.");
    }

    const [teamRow] = await db
      .select({ screeningStatus: team.screeningStatus })
      .from(team)
      .where(eq(team.id, actor.teamId))
      .limit(1);

    if (teamRow?.screeningStatus !== "approved") {
      throw new AppError(
        403,
        "TEAM_NOT_APPROVED",
        "Only approved teams can request a mentor.",
      );
    }

    const req = await createMentorRequest(actor.teamId);
    return jsonSuccess({ request: req }, 201);
  } catch (e) {
    return toErrorResponse(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireSessionUser(request);
    if (!actor.teamId) {
      throw new AppError(400, "NO_TEAM", "You must be in a team.");
    }
    await cancelMentorRequest(actor.teamId);
    return jsonSuccess({ cancelled: true });
  } catch (e) {
    return toErrorResponse(e);
  }
}
