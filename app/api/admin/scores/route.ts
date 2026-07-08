import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getAllDetailedScores, listApprovedTeamsScoringAdjustments } from "@/lib/scoring/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const [scores, teams] = await Promise.all([
      getAllDetailedScores(),
      listApprovedTeamsScoringAdjustments(),
    ]);
    return jsonSuccess({ scores, teams });
  } catch (error) {
    return toErrorResponse(error);
  }
}
