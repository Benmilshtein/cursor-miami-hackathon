import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { listCurrentTeamMembers } from "@/lib/teams/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const result = await listCurrentTeamMembers(actor);

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
