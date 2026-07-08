import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { leaveCurrentTeam } from "@/lib/teams/service";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const result = await leaveCurrentTeam(actor);

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
