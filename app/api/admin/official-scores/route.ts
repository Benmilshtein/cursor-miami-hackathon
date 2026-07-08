import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getAdminOfficialScoresPageData } from "@/lib/scoring/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);

    const { judgeSlots, criteria, teams } = await getAdminOfficialScoresPageData();

    return jsonSuccess({ judgeSlots, criteria, teams });
  } catch (error) {
    return toErrorResponse(error);
  }
}
