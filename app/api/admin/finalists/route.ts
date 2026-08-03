import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  getPitchJudgeCount,
  listFinalists,
  listRankingForFinalistPicker,
  selectTopFinalists,
  setTeamFinalist,
} from "@/lib/scoring/finalists";
import { EVENT_FINALIST_TARGET } from "@/lib/scoring/constants";

export const dynamic = "force-dynamic";

/** Current finals roster, the full ranked field to pick from, and pitch progress. */
export async function GET() {
  try {
    await requireSuperAdminUser();
    const [ranking, pitchJudgeCount] = await Promise.all([
      listRankingForFinalistPicker(),
      getPitchJudgeCount(),
    ]);
    return jsonSuccess({
      finalists: ranking.filter((r) => r.isFinalist),
      ranking,
      pitchJudgeCount,
      defaultTopN: EVENT_FINALIST_TARGET,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Promote the top N teams by build score, replacing the current roster. */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser();
    const body = await parseJsonBody<{ topN?: unknown }>(request);
    const topN = Number(body.topN ?? EVENT_FINALIST_TARGET);
    const finalists = await selectTopFinalists(topN);
    return jsonSuccess({ finalists });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Add or remove a single team from the finals roster. */
export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdminUser();
    const body = await parseJsonBody<{ teamId?: unknown; isFinalist?: unknown }>(request);
    const teamId = Number(body.teamId);
    if (!Number.isInteger(teamId) || teamId <= 0) {
      throw new AppError(400, "INVALID_INPUT", "Invalid team ID.");
    }
    if (typeof body.isFinalist !== "boolean") {
      throw new AppError(400, "INVALID_INPUT", "isFinalist must be true or false.");
    }
    await setTeamFinalist(teamId, body.isFinalist);
    return jsonSuccess({ finalists: await listFinalists() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
