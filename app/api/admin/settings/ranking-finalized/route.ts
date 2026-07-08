import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { isRankingFinalized, setRankingFinalized } from "@/lib/scoring/finalization";
import { notifyRankingUpdate } from "@/lib/scoring/events";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const finalized = await isRankingFinalized();
    return jsonSuccess({ finalized });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{ finalized: boolean }>(request);
    await setRankingFinalized(!!body.finalized);
    notifyRankingUpdate();
    return jsonSuccess({ finalized: !!body.finalized });
  } catch (error) {
    return toErrorResponse(error);
  }
}
