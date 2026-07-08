import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { TEAM_LIMITS } from "@/lib/teams/constants";
import { listTeamsForAdmin } from "@/lib/teams/service";

function parsePositiveInt(value: string | null, fallback: number, field: string) {
  if (value === null) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new AppError(400, "INVALID_QUERY", `${field} must be a non-negative integer.`);
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parsePositiveInt(
        searchParams.get("limit"),
        TEAM_LIMITS.adminListDefaultLimit,
        "limit",
      ),
      TEAM_LIMITS.adminListMaxLimit,
    );
    const offset = parsePositiveInt(searchParams.get("offset"), 0, "offset");
    const search = searchParams.get("search")?.trim() || undefined;
    const status = searchParams.get("status");
    let normalizedStatus: "active" | "archived" | undefined;

    if (status && status !== "active" && status !== "archived") {
      throw new AppError(400, "INVALID_QUERY", "status must be active or archived.");
    }

    if (status === "active" || status === "archived") {
      normalizedStatus = status;
    }

    const result = await listTeamsForAdmin({
      limit,
      offset,
      search,
      status: normalizedStatus,
    });

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
