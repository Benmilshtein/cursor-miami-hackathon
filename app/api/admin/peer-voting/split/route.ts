import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getGroupCounts, splitTeamsIntoGroups } from "@/lib/peer-voting/service";

/** Current Group A / Group B / unassigned counts for active teams. */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const groups = await getGroupCounts();
    return jsonSuccess({ groups });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Randomly split active teams into two even groups (guarded: closed + no votes). */
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const groups = await splitTeamsIntoGroups();
    return jsonSuccess({ groups });
  } catch (error) {
    return toErrorResponse(error);
  }
}
