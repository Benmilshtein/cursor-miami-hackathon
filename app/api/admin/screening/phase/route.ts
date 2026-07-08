import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  getScreeningPhase,
  isValidPhase,
  setScreeningPhase,
} from "@/lib/screening-phase";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const phase = await getScreeningPhase();
    return jsonSuccess({ phase });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{ phase: string }>(request);

    if (!body.phase || !isValidPhase(body.phase)) {
      throw new AppError(
        400,
        "INVALID_PHASE",
        "Phase must be one of: registration, screening_active, screening_completed.",
      );
    }

    await setScreeningPhase(body.phase);
    return jsonSuccess({ phase: body.phase });
  } catch (error) {
    return toErrorResponse(error);
  }
}
