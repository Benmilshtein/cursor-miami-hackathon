import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getMatchingPoolSize, runTeamMatching } from "@/lib/teams/matching-service";

/** Pool size preview — how many opted-in, un-teamed participants are waiting. */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const poolSize = await getMatchingPoolSize();
    return jsonSuccess({ poolSize });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Shuffle the auto-match pool into balanced teams and persist them. */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const result = await runTeamMatching();
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
