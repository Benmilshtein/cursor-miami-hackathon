import type { NextRequest } from "next/server";
import {
  AppError,
  jsonSuccess,
  parseJsonBody,
  toErrorResponse,
} from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getProjectDeadline, setProjectDeadline } from "@/lib/projects/service";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const deadline = await getProjectDeadline();
    return jsonSuccess({ deadline: deadline?.toISOString() ?? null });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{ deadline: string | null }>(request);

    let parsed: Date | null = null;
    if (body.deadline) {
      parsed = new Date(body.deadline);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError(400, "INVALID_INPUT", "Invalid deadline date.");
      }
    }

    const result = await setProjectDeadline(parsed);
    return jsonSuccess({ deadline: result?.toISOString() ?? null });
  } catch (error) {
    return toErrorResponse(error);
  }
}
